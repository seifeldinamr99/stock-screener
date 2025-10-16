from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
import pandas as pd
from pathlib import Path
from screener.models import Stock, Sector, Industry, Exchange


class Command(BaseCommand):
    help = 'Update stock classifications from Excel file - FIXED VERSION to handle multiple exchanges'

    def add_arguments(self, parser):
        parser.add_argument('excel_file', type=str, help='Path to the Excel file with classifications')
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--sheet',
            type=str,
            help='Process only a specific sheet name',
        )

    def find_column(self, df, possible_names):
        """Find a column by checking multiple possible names (case-insensitive)"""
        df_columns_lower = [col.lower() for col in df.columns]

        for name in possible_names:
            name_lower = name.lower()
            if name_lower in df_columns_lower:
                return df.columns[df_columns_lower.index(name_lower)]
        return None

    def get_or_create_sector(self, sector_name):
        """Get or create a Sector object"""
        if not sector_name or pd.isna(sector_name) or str(sector_name).strip() == '':
            return None

        sector_name = str(sector_name).strip()
        sector, created = Sector.objects.get_or_create(name=sector_name)
        if created:
            self.stdout.write(f"  Created new sector: {sector_name}")
        return sector

    def get_or_create_industry(self, industry_name, sector):
        """Get or create an Industry object"""
        if not industry_name or pd.isna(industry_name) or str(industry_name).strip() == '':
            return None

        industry_name = str(industry_name).strip()
        industry, created = Industry.objects.get_or_create(
            name=industry_name,
            defaults={'sector': sector}
        )
        if created:
            self.stdout.write(f"  Created new industry: {industry_name} (Sector: {sector.name if sector else 'None'})")
        elif industry.sector != sector and sector:
            self.stdout.write(f"  Updated industry '{industry_name}' sector from '{industry.sector.name if industry.sector else 'None'}' to '{sector.name}'")
            industry.sector = sector
            industry.save()

        return industry

    def get_exchanges_for_country_sheet(self, sheet_name):
        """Get ALL possible exchanges for a country/sheet - FIXED VERSION"""

        # Country to exchange mappings - return ALL exchanges for each country
        # Based on your actual database exchanges
        country_exchange_groups = {
            'USA': ['NYSE', 'NGM', 'NCM', 'NGSM', 'PSL', 'NML', 'NYSEARCA'],
            'INDIA': ['NSE', 'BSE'],
            'LONDON': ['LSE', 'LSEAIM'],
            'SHANGHAI': ['SSE'],
            'SHENZHEN': ['SZSE'],
            'SHEHNZEN': ['SZSE'],  # Common misspelling
            'HONG KONG': ['HKEX'],
            'TOKYO': ['TSE'],
            'CANADA': ['TSX', 'TVE', 'CNSE'],
            'EURONEXT': ['ENXPA', 'ENXAM', 'ENXBR', 'ENXLI'],
        }

        sheet_upper = sheet_name.upper()

        if sheet_upper in country_exchange_groups:
            # Get all exchanges that exist in database for this country
            possible_codes = country_exchange_groups[sheet_upper]
            existing_exchanges = []

            for code in possible_codes:
                try:
                    exchange = Exchange.objects.get(code=code)
                    existing_exchanges.append(exchange)
                except Exchange.DoesNotExist:
                    continue

            if existing_exchanges:
                self.stdout.write(f"Found {len(existing_exchanges)} exchanges for '{sheet_name}': {[ex.code for ex in existing_exchanges]}")
                return existing_exchanges

        # Fallback: try to find any exchange for this country
        try:
            # Try by country field
            exchanges_by_country = Exchange.objects.filter(country__icontains=sheet_name)
            if exchanges_by_country.exists():
                self.stdout.write(f"Found exchanges by country match: {[ex.code for ex in exchanges_by_country]}")
                return list(exchanges_by_country)
        except:
            pass

        self.stdout.write(f"No exchanges found for sheet '{sheet_name}'")
        return []

    def process_sheet(self, df, sheet_name, dry_run=False):
        """Process a single sheet of the Excel file - FIXED VERSION"""
        self.stdout.write(f"\nProcessing sheet: {sheet_name}")
        self.stdout.write(f"Sheet has {len(df)} rows")

        # Find the ticker column
        ticker_col = self.find_column(df, ['ticker', 'symbol', 'stock', 'code', 'tick'])
        if not ticker_col:
            self.stdout.write(self.style.ERROR(f"Could not find ticker column in sheet '{sheet_name}'"))
            self.stdout.write(f"Available columns: {list(df.columns)}")
            return 0, 0, 0

        # Find the sector column
        sector_col = self.find_column(df, ['sector', 'sec', 'sector_name', 'industry_group'])
        if not sector_col:
            self.stdout.write(self.style.WARNING(f"Could not find sector column in sheet '{sheet_name}'"))

        # Find the industry column
        industry_col = self.find_column(df, ['industry', 'ind', 'industry_name', 'sub_industry', 'subindustry'])
        if not industry_col:
            self.stdout.write(self.style.WARNING(f"Could not find industry column in sheet '{sheet_name}'"))

        if not sector_col and not industry_col:
            self.stdout.write(self.style.ERROR(f"No sector or industry columns found in sheet '{sheet_name}'"))
            return 0, 0, 0

        self.stdout.write(f"Using columns - Ticker: '{ticker_col}', Sector: '{sector_col}', Industry: '{industry_col}'")

        # Get ALL possible exchanges for this sheet
        possible_exchanges = self.get_exchanges_for_country_sheet(sheet_name)

        # Clean the dataframe
        df = df.dropna(subset=[ticker_col])
        df[ticker_col] = df[ticker_col].astype(str).str.strip().str.upper()

        updated_count = 0
        not_found_count = 0
        error_count = 0

        for index, row in df.iterrows():
            ticker = row[ticker_col]

            if not ticker or ticker == 'NAN':
                continue

            try:
                # FIXED: Try to find the stock by ticker across ALL possible exchanges
                stock = None

                if possible_exchanges:
                    # First try: look in the suggested exchanges for this country
                    for exchange in possible_exchanges:
                        stock = Stock.objects.filter(ticker=ticker, exchange=exchange).first()
                        if stock:
                            break

                if not stock:
                    # Second try: look for ticker anywhere in database (no exchange filter)
                    stock = Stock.objects.filter(ticker=ticker).first()

                if not stock:
                    self.stdout.write(f"  Stock not found: {ticker}")
                    not_found_count += 1
                    continue

                # Get sector and industry data
                sector_name = row.get(sector_col) if sector_col else None
                industry_name = row.get(industry_col) if industry_col else None

                # Process sector
                sector = None
                if sector_name and not pd.isna(sector_name):
                    sector = self.get_or_create_sector(sector_name)

                # Process industry
                industry = None
                if industry_name and not pd.isna(industry_name):
                    industry = self.get_or_create_industry(industry_name, sector)

                # Update the stock
                updated = False
                old_sector = stock.sector.name if stock.sector else 'None'
                old_industry = stock.industry.name if stock.industry else 'None'

                if sector and stock.sector != sector:
                    if not dry_run:
                        stock.sector = sector
                    updated = True

                if industry and stock.industry != industry:
                    if not dry_run:
                        stock.industry = industry
                    updated = True

                if updated:
                    if not dry_run:
                        stock.save()
                    new_sector = sector.name if sector else (stock.sector.name if stock.sector else 'None')
                    new_industry = industry.name if industry else (stock.industry.name if stock.industry else 'None')
                    action = "[DRY RUN] Would update" if dry_run else "Updated"
                    self.stdout.write(f"  {action} {ticker} ({stock.exchange.code}): Sector: {old_sector} -> {new_sector}, Industry: {old_industry} -> {new_industry}")
                    updated_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing {ticker}: {str(e)}"))
                error_count += 1

        return updated_count, not_found_count, error_count

    @transaction.atomic
    def handle(self, *args, **options):
        excel_path = Path(options['excel_file'])
        dry_run = options['dry_run']
        specific_sheet = options.get('sheet')

        if not excel_path.exists():
            raise CommandError(f"Excel file not found: {excel_path}")

        self.stdout.write(f"Reading Excel file: {excel_path}")

        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No changes will be made to the database"))

        try:
            # Read all sheets from the Excel file
            excel_file = pd.ExcelFile(excel_path)
            sheet_names = excel_file.sheet_names

            if specific_sheet:
                if specific_sheet not in sheet_names:
                    raise CommandError(f"Sheet '{specific_sheet}' not found. Available sheets: {sheet_names}")
                sheet_names = [specific_sheet]

            self.stdout.write(f"Found {len(sheet_names)} sheets to process: {sheet_names}")

            total_updated = 0
            total_not_found = 0
            total_errors = 0

            for sheet_name in sheet_names:
                try:
                    df = pd.read_excel(excel_path, sheet_name=sheet_name)

                    if df.empty:
                        self.stdout.write(f"Sheet '{sheet_name}' is empty, skipping...")
                        continue

                    # Process the sheet
                    updated, not_found, errors = self.process_sheet(df, sheet_name, dry_run)

                    total_updated += updated
                    total_not_found += not_found
                    total_errors += errors

                    self.stdout.write(f"Sheet '{sheet_name}' results: {updated} updated, {not_found} not found, {errors} errors")

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error processing sheet '{sheet_name}': {str(e)}"))
                    total_errors += 1

            self.stdout.write("\n" + "=" * 50)
            self.stdout.write(self.style.SUCCESS("SUMMARY"))
            self.stdout.write("=" * 50)
            self.stdout.write(f"Total stocks updated: {total_updated}")
            self.stdout.write(f"Total stocks not found: {total_not_found}")
            self.stdout.write(f"Total errors: {total_errors}")

            if dry_run:
                self.stdout.write(self.style.WARNING("\nDRY RUN MODE - No changes were made to the database"))
            else:
                self.stdout.write(self.style.SUCCESS(f"\nSuccessfully updated {total_updated} stock classifications"))

        except Exception as e:
            raise CommandError(f"Error reading Excel file: {str(e)}")