from decimal import Decimal, InvalidOperation
import re
from pathlib import Path

import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from screener.models import Exchange, Industry, Sector, Stock

COUNTRY_ALIASES = {
    'india_mid_cap': 'India',
}

EXCHANGE_NAME_TO_CODE = {
    'national stock exchange of india': ('NSE', 'National Stock Exchange of India'),
    'shanghai stock exchange': ('SSE', 'Shanghai Stock Exchange'),
    'london stock exchange': ('LSE', 'London Stock Exchange'),
    'london stock exchange aim market': ('LSE', 'London Stock Exchange'),
    'euronext': ('ENX', 'Euronext'),
    'euronext paris': ('ENX', 'Euronext'),
    'euronext amsterdam': ('ENX', 'Euronext'),
    'euronext brussels': ('ENX', 'Euronext'),
    'euronext lisbon': ('ENX', 'Euronext'),
    'euronext dublin': ('ENX', 'Euronext'),
    'euronext oslo': ('ENX', 'Euronext'),
    'new york stock exchange': ('NYSE', 'New York Stock Exchange'),
    'nyse arca': ('NYSEARCA', 'NYSE Arca'),
    'nyse mkt llc': ('NYSEAM', 'NYSE American'),
    'nasdaq global select': ('NASDAQ', 'Nasdaq'),
    'nasdaq global market': ('NASDAQ', 'Nasdaq'),
    'nasdaq capital market': ('NASDAQ', 'Nasdaq'),
    'pink sheets llc': ('OTC', 'OTC Markets'),
    'shenzhen stock exchange': ('SZSE', 'Shenzhen Stock Exchange'),
    'the tokyo stock exchange': ('TSE', 'Tokyo Stock Exchange'),
    'tokyo stock exchange': ('TSE', 'Tokyo Stock Exchange'),
    'the toronto stock exchange': ('TSX', 'Toronto Stock Exchange'),
    'tsx venture exchange': ('TSXV', 'TSX Venture Exchange'),
    'canadian national stock exchange': ('CSE', 'Canadian Securities Exchange'),
    'the stock exchange of hong kong ltd.': ('HKEX', 'Hong Kong Exchanges and Clearing'),
    'the stock exchange of hong kong ltd': ('HKEX', 'Hong Kong Exchanges and Clearing'),
    'hong kong exchanges and clearing': ('HKEX', 'Hong Kong Exchanges and Clearing'),
}

EXCHANGE_CODE_ALIASES = {
    'INDIA': 'NSE',
    'SHANGHAI': 'SSE',
    'SHANGHAIST': 'SSE',
    'SH': 'SSE',
    'LONDON': 'LSE',
    'LSE': 'LSE',
    'EURONEXT': 'ENX',
    'PARIS': 'ENX',
    'AMSTERDAM': 'ENX',
    'BRUSSELS': 'ENX',
    'LISBON': 'ENX',
    'DUBLIN': 'ENX',
    'OSLO': 'ENX',
    'ENX': 'ENX',
    'NASDAQ': 'NASDAQ',
    'NYSE': 'NYSE',
    'NYSEARCA': 'NYSEARCA',
    'NYSEMKT': 'NYSEAM',
    'NYSEAMERICAN': 'NYSEAM',
    'NYSEAM': 'NYSEAM',
    'OTCMARKETS': 'OTC',
    'OTC': 'OTC',
    'SHENZHEN': 'SZSE',
    'SZSE': 'SZSE',
    'TOKYO': 'TSE',
    'TSE': 'TSE',
    'TORONTO': 'TSX',
    'TSX': 'TSX',
    'TSXV': 'TSXV',
    'CSE': 'CSE',
    'HONGKONG': 'HKEX',
    'HKEX': 'HKEX',
}

EXCHANGE_CODE_TO_NAME = {
    'NSE': 'National Stock Exchange of India',
    'SSE': 'Shanghai Stock Exchange',
    'LSE': 'London Stock Exchange',
    'ENX': 'Euronext',
    'NYSE': 'New York Stock Exchange',
    'NYSEARCA': 'NYSE Arca',
    'NYSEAM': 'NYSE American',
    'NASDAQ': 'Nasdaq',
    'OTC': 'OTC Markets',
    'SZSE': 'Shenzhen Stock Exchange',
    'TSE': 'Tokyo Stock Exchange',
    'TSX': 'Toronto Stock Exchange',
    'TSXV': 'TSX Venture Exchange',
    'CSE': 'Canadian Securities Exchange',
    'HKEX': 'Hong Kong Exchanges and Clearing',
}

SMALL_DECIMAL_LIMIT = Decimal('999999.9999')

COLUMN_MAP = {
    'name': 'name',
    'name short': 'company_name',
    'company name': 'company_name',
    'full ticker': 'full_ticker',
    'ticker': 'ticker',
    'price, current': 'price',
    'price current': 'price',
    'price percent change today': 'price_change_percent',
    'price_target': 'price_target',
    'fair value': 'fair_value',
    'fair value (analyst target)': 'analyst_target',
    'fair value label (analyst target)': 'analyst_target_label',
    'fair value label': 'fair_value_label',
    'fair value label (analyst targets)': 'analyst_target_label',
    'fair value upside': 'analyst_upside',
    'overall health label': 'health_label',
    'market cap (adjusted)': 'market_cap',
    'market cap': 'market_cap',
    'dividend per share': 'dividend_per_share',
    'dividend yield': 'dividend_yield',
    'relative strength index (14d)': 'relative_strength_index',
    'p/e ratio': 'pe_ratio',
    'p/e ratio, current': 'pe_ratio',
    'price / book': 'price_to_book',
    'price / ltm sales': 'price_to_sales',
    'enterprise value (ev)': 'enterprise_value',
    'total debt / total capital': 'total_debt_to_total_capital',
    'float shares / outstanding': 'float_shares_to_outstanding',
    'peg ratio': 'peg_ratio',
    'peg ratio, current': 'peg_ratio',
    'upside (analyst target)': 'analyst_upside',
    'industry': 'industry',
    'sector': 'sector',
    'stock exchange name': 'exchange_long_name',
    'investing_exchange': 'exchange_short_name',
    'exchange': 'exchange_short_name',
    'exchange_name_short': 'exchange_short_name',
    'operating country': 'operating_country',
    'country': 'country',
    'operating country iso code': 'operating_country_iso',
}

def _parse_decimal(value):
    """Convert spreadsheet value to Decimal or None."""
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    text = str(value).strip()
    if text == '' or text in {'-', '--', '—', 'N/A', 'nan', 'None'}:
        return None
    cleaned = text.replace(',', '')
    try:
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return None


def _normalise_code(value, fallback):
    """Generate a safe exchange code with max length 10."""
    source = value if value and str(value).strip() not in {'-', '--'} else fallback
    if not source:
        source = fallback or 'UNKNOWN'
    code = re.sub(r'[^A-Za-z0-9]', '', str(source).upper())
    return code[:10] if code else 'UNKNOWN'


def _coalesce(*values):
    for value in values:
        if value and not (isinstance(value, float) and pd.isna(value)):
            text = str(value).strip()
            if text and text not in {'-', '--', 'N/A', 'n/a'}:
                return text
    return None


def _normalize_country(value):
    if not value:
        return None
    text = str(value).strip()
    key = re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')
    if key in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[key]
    return text


def _normalize_ticker(value):
    if value is None:
        return None
    if isinstance(value, float):
        if pd.isna(value):
            return None
        if value.is_integer():
            return str(int(value))
        text = format(value, 'f').rstrip('0').rstrip('.')
        return text or str(int(value))
    text = str(value).strip()
    if not text:
        return None
    if re.fullmatch(r'\d+\.0+', text):
        return text.split('.', 1)[0]
    return text


def _cap_decimal(value, limit):
    if value is None or limit is None:
        return value
    if value > limit:
        return limit
    if value < -limit:
        return -limit
    return value


class Command(BaseCommand):
    help = 'Import ticker data from all Excel files inside the Tickers directory.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--directory',
            default='Tickers',
            help='Directory containing Excel files (default: Tickers)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Process files and show summary without writing to the database'
        )

    def handle(self, *args, **options):
        directory = Path(options['directory']).resolve()
        dry_run = options['dry_run']

        if not directory.exists():
            raise CommandError(f"Directory not found: {directory}")

        excel_files = sorted(directory.glob('*.xlsx'))
        if not excel_files:
            raise CommandError(f"No Excel files found in {directory}")

        overall_created = 0
        overall_updated = 0
        overall_skipped = 0

        for excel_path in excel_files:
            self.stdout.write(self.style.MIGRATE_HEADING(f"\nProcessing {excel_path.name}"))
            created, updated, skipped = self._process_file(excel_path, dry_run=dry_run)
            overall_created += created
            overall_updated += updated
            overall_skipped += skipped
            self.stdout.write(
                f"  {excel_path.name}: {created} created, {updated} updated, {skipped} skipped"
            )

        self.stdout.write(self.style.SUCCESS("\nImport complete"))
        self.stdout.write(f"Total created: {overall_created}")
        self.stdout.write(f"Total updated: {overall_updated}")
        self.stdout.write(f"Total skipped: {overall_skipped}")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run enabled: no database changes were saved."))

    def _process_file(self, excel_path: Path, dry_run: bool = False):
        header_index = self._locate_header(excel_path)
        if header_index is None:
            self.stdout.write(self.style.WARNING("  Header row not found; skipping file"))
            return 0, 0, 0

        df = pd.read_excel(excel_path, header=header_index)
        df = df.dropna(how='all')
        df.columns = [COLUMN_MAP.get(str(col).strip().lower(), None) for col in df.columns]
        df = df.loc[:, [col for col in df.columns if col]]  # drop columns without a mapping

        if 'ticker' not in df.columns:
            self.stdout.write(self.style.WARNING("  Ticker column missing after normalisation; skipping file"))
            return 0, 0, 0

        df = df[df['ticker'].notna()]

        file_created = 0
        file_updated = 0
        file_skipped = 0

        use_full_ticker = 'shenzhen stock exchange' in excel_path.stem.lower()

        context_defaults = {
            'exchange_code_fallback': _normalise_code(excel_path.stem, excel_path.stem[:10].upper()),
            'exchange_name_fallback': excel_path.stem.replace('_', ' '),
            'use_full_ticker': use_full_ticker,
        }

        @transaction.atomic
        def _import_rows():
            nonlocal file_created, file_updated, file_skipped
            for _, row in df.iterrows():
                result = self._import_row(row, excel_path, context_defaults)
                if result == 'created':
                    file_created += 1
                elif result == 'updated':
                    file_updated += 1
                else:
                    file_skipped += 1
            if dry_run:
                raise transaction.TransactionManagementError("Dry run requested")

        try:
            _import_rows()
        except transaction.TransactionManagementError:
            # Dry run: count numbers but rollback changes
            pass

        return file_created, file_updated, file_skipped

    def _locate_header(self, excel_path: Path):
        preview = pd.read_excel(excel_path, header=None)
        for idx, row in preview.iterrows():
            values = [
                str(value).strip().lower()
                for value in row
                if isinstance(value, str)
            ]
            if 'ticker' in values:
                return idx
        return None

    def _import_row(self, row, excel_path: Path, context_defaults: dict):
        ticker_source = _coalesce(row.get('ticker'))
        if context_defaults.get('use_full_ticker'):
            ticker_source = _coalesce(row.get('full_ticker'), ticker_source)

        ticker = _normalize_ticker(ticker_source)
        if not ticker:
            return 'skipped'

        company_name = _coalesce(row.get('company_name'), row.get('name'))
        if not company_name:
            self.stdout.write(f"    Skipping {ticker}: missing company name")
            return 'skipped'

        exchange_name = _coalesce(row.get('exchange_long_name'), context_defaults.get('exchange_name_fallback'))
        exchange_code_raw = _normalise_code(row.get('exchange_short_name'), context_defaults['exchange_code_fallback'])

        canonical_code = EXCHANGE_CODE_ALIASES.get(exchange_code_raw, exchange_code_raw)
        canonical_name = exchange_name
        if exchange_name:
            name_key = exchange_name.strip().lower()
            if name_key in EXCHANGE_NAME_TO_CODE:
                canonical_code, mapped_name = EXCHANGE_NAME_TO_CODE[name_key]
                canonical_name = mapped_name
        if canonical_name is None:
            canonical_name = EXCHANGE_CODE_TO_NAME.get(canonical_code)
        if canonical_name is None:
            canonical_name = canonical_code
        canonical_name = EXCHANGE_CODE_TO_NAME.get(canonical_code, canonical_name)

        exchange_country = _normalize_country(_coalesce(row.get('operating_country')) or _coalesce(excel_path.stem))

        exchange, _ = Exchange.objects.get_or_create(
            code=canonical_code,
            defaults={
                'name': canonical_name,
                'country': exchange_country or 'Unknown',
            },
        )

        updated_exchange = False
        if exchange.name != canonical_name and canonical_name:
            exchange.name = canonical_name
            updated_exchange = True
        if exchange_country and exchange.country != exchange_country:
            exchange.country = exchange_country
            updated_exchange = True
        if updated_exchange:
            exchange.save()

        sector_obj = None
        industry_obj = None

        sector_name = _coalesce(row.get('sector'))
        if sector_name:
            sector_obj, _ = Sector.objects.get_or_create(name=sector_name)

        industry_name = _coalesce(row.get('industry'))
        if industry_name:
            industry_obj, _ = Industry.objects.get_or_create(
                name=industry_name,
                defaults={'sector': sector_obj} if sector_obj else {}
            )
            if sector_obj and industry_obj.sector != sector_obj:
                industry_obj.sector = sector_obj
                industry_obj.save()

        stock_defaults = {
            'company_name': company_name,
            'full_ticker': _coalesce(row.get('full_ticker')),
            'exchange': exchange,
            'sector': sector_obj,
            'industry': industry_obj,
            'country': _normalize_country(_coalesce(row.get('operating_country'), row.get('country'), row.get('operating_country_iso'), exchange_country, 'Unknown')),
            'operating_country': _normalize_country(_coalesce(row.get('operating_country'))),
            'operating_country_iso': _coalesce(row.get('operating_country_iso')),
            'exchange_long_name': canonical_name,
            'exchange_short_name': _coalesce(row.get('exchange_short_name')) or canonical_code,
            'price': _parse_decimal(row.get('price')),
            'price_target': _parse_decimal(row.get('price_target')),
            'fair_value': _parse_decimal(row.get('fair_value')),
            'fair_value_label': _coalesce(row.get('fair_value_label')),
            'analyst_target': _parse_decimal(row.get('analyst_target')),
            'analyst_target_label': _coalesce(row.get('analyst_target_label')),
            'health_label': _coalesce(row.get('health_label')),
            'market_cap': _parse_decimal(row.get('market_cap')),
            'dividend_per_share': _parse_decimal(row.get('dividend_per_share')),
            'dividend_yield': _parse_decimal(row.get('dividend_yield')),
            'relative_strength_index': _parse_decimal(row.get('relative_strength_index')),
            'pe_ratio': _parse_decimal(row.get('pe_ratio')),
            'price_to_book': _cap_decimal(_parse_decimal(row.get('price_to_book')), SMALL_DECIMAL_LIMIT),
            'price_to_sales': _cap_decimal(_parse_decimal(row.get('price_to_sales')), SMALL_DECIMAL_LIMIT),
            'enterprise_value': _parse_decimal(row.get('enterprise_value')),
            'total_debt_to_total_capital': _parse_decimal(row.get('total_debt_to_total_capital')),
            'float_shares_to_outstanding': _parse_decimal(row.get('float_shares_to_outstanding')),
        }

        try:
            stock, created = Stock.objects.update_or_create(
                ticker=ticker,
                defaults=stock_defaults,
            )
        except Exception as exc:  # pylint: disable=broad-except
            self.stdout.write(self.style.ERROR(f"    Error importing {ticker}: {exc}"))
            return 'skipped'

        action = 'created' if created else 'updated'
        self.stdout.write(f"    {action.title()} {ticker} ({company_name})")
        return action
