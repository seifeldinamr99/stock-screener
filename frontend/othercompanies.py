import pandas as pd
import numpy as np
from collections import Counter

def extract_small_industries(excel_file_path, min_companies=20, output_file="small_industries_data.xlsx"):
    """
    Extract all companies from industries that have fewer than the minimum threshold
    
    Parameters:
    excel_file_path: Path to your combined Excel file
    min_companies: Minimum number of companies required for an industry (default: 20)
    output_file: Name for the output Excel file
    """
    
    print("🔍 Loading data...")
    try:
        # Read the combined data
        df = pd.read_excel(excel_file_path)
        print(f"✅ Loaded {len(df):,} companies")
        
        # Display column names to verify structure
        print(f"📋 Columns found: {list(df.columns)}")
        
    except Exception as e:
        print(f"❌ Error loading file: {e}")
        return None
    
    # Clean the data
    df = df.dropna(subset=['Industry']).copy()
    df['Industry'] = df['Industry'].astype(str).str.strip()
    df['Sector'] = df['Sector'].astype(str).str.strip()
    
    print(f"📊 After cleaning: {len(df):,} companies")
    
    # Count companies per industry
    print("\n🔢 Counting companies per industry...")
    industry_counts = df['Industry'].value_counts()
    
    # Identify small industries
    small_industries = industry_counts[industry_counts < min_companies]
    large_industries = industry_counts[industry_counts >= min_companies]
    
    print(f"\n📈 Industry Analysis:")
    print(f"   • Total industries: {len(industry_counts):,}")
    print(f"   • Industries with <{min_companies} companies: {len(small_industries):,}")
    print(f"   • Industries with ≥{min_companies} companies: {len(large_industries):,}")
    
    # Extract companies from small industries
    small_industry_companies = df[df['Industry'].isin(small_industries.index)].copy()
    
    print(f"\n🎯 Small Industries Data:")
    print(f"   • Companies in small industries: {len(small_industry_companies):,}")
    print(f"   • Percentage of total: {len(small_industry_companies)/len(df)*100:.1f}%")
    
    # Create summary statistics
    sector_breakdown = small_industry_companies['Sector'].value_counts()
    
    print(f"\n📊 Small Industries by Sector:")
    for sector, count in sector_breakdown.head(10).items():
        print(f"   • {sector}: {count:,} companies")
    
    # Prepare detailed analysis
    small_industry_analysis = []
    for industry in small_industries.index:
        industry_data = df[df['Industry'] == industry]
        sector = industry_data['Sector'].iloc[0]
        company_count = len(industry_data)
        exchanges = industry_data['Exchange'].value_counts().to_dict() if 'Exchange' in df.columns else {}
        
        small_industry_analysis.append({
            'Industry': industry,
            'Sector': sector,
            'Company_Count': company_count,
            'Sample_Companies': ', '.join(industry_data['Company Name'].head(3).tolist()),
            'Exchanges': str(exchanges)
        })
    
    analysis_df = pd.DataFrame(small_industry_analysis)
    analysis_df = analysis_df.sort_values(['Sector', 'Company_Count'], ascending=[True, False])
    
    # Save results to Excel with multiple sheets
    print(f"\n💾 Saving results to {output_file}...")
    
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        # Main data: all companies from small industries
        small_industry_companies.to_excel(writer, sheet_name='Small_Industry_Companies', index=False)
        
        # Analysis: industry breakdown
        analysis_df.to_excel(writer, sheet_name='Industry_Analysis', index=False)
        
        # Summary by sector
        sector_summary = small_industry_companies.groupby('Sector').agg({
            'Industry': 'nunique',
            'Company Name': 'count'
        }).rename(columns={'Industry': 'Num_Industries', 'Company Name': 'Num_Companies'})
        sector_summary = sector_summary.sort_values('Num_Companies', ascending=False)
        sector_summary.to_excel(writer, sheet_name='Sector_Summary')
        
        # Industry size distribution
        size_distribution = pd.DataFrame({
            'Industry_Size': range(1, min_companies),
            'Count_of_Industries': [sum(industry_counts == i) for i in range(1, min_companies)]
        })
        size_distribution.to_excel(writer, sheet_name='Size_Distribution', index=False)
        
        # Sample of large industries for comparison
        large_industry_sample = pd.DataFrame({
            'Industry': large_industries.head(20).index,
            'Company_Count': large_industries.head(20).values,
            'Sector': [df[df['Industry'] == ind]['Sector'].iloc[0] for ind in large_industries.head(20).index]
        })
        large_industry_sample.to_excel(writer, sheet_name='Large_Industries_Sample', index=False)
    
    print(f"✅ Results saved successfully!")
    print(f"\n📄 Output file contains {len(small_industry_companies):,} companies from {len(small_industries)} small industries")
    
    # Display top problematic sectors
    print(f"\n🔍 Top sectors with most small-industry companies:")
    for i, (sector, count) in enumerate(sector_breakdown.head(5).items(), 1):
        sector_industries = len(small_industry_companies[small_industry_companies['Sector'] == sector]['Industry'].unique())
        print(f"   {i}. {sector}: {count:,} companies in {sector_industries} small industries")
    
    return small_industry_companies, analysis_df

def main():
    """Main execution function"""
    # Your file path (using raw string to handle backslashes)
    EXCEL_FILE = r"C:\Users\DELL\PycharmProjects\stock_screener\combined_all_exchanges.xlsx"
    
    # Extract small industries data
    small_companies, analysis = extract_small_industries(
        excel_file_path=EXCEL_FILE,
        min_companies=20,
        output_file="small_industries_extraction.xlsx"
    )
    
    if small_companies is not None:
        print("\n🎉 Extraction completed successfully!")
        print("\nNext steps:")
        print("1. Review 'small_industries_extraction.xlsx'")
        print("2. Focus on the largest sectors for reclassification")
        print("3. Analyze original industry patterns to create logical groupings")

if __name__ == "__main__":
    main()