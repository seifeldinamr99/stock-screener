# Page 4: Fund Parameters Configuration

## 📋 Page Overview

**Route**: `/fund-simulation/parameters`  
**Previous**: Strategy Selection Page (with 0-5 strategies selected)  
**Next**: Fund Construction Results Page  
**Purpose**: Configure all parameters before building funds

---

## 🎨 UI Layout Structure

### **Header Section**
```
┌─────────────────────────────────────────────────────────────┐
│  Configure Your Funds                                        │
│                                                              │
│  Selected Strategies (3):                                    │
│  [🏢 Market-Cap Weighted] [⚖️ Equal Weighted] [📈 Factor-Based]│
│  (Each shows as a removable tag/chip)                       │
└─────────────────────────────────────────────────────────────┘
```

### **Section 1: General Parameters** (Always Visible)
```
General Parameters
Applied to all selected funds

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Number of Holdings                                          │
│  ├─────●────────┤  [25] stocks                             │
│  20          30                                              │
│  Choose how many stocks each fund will hold                 │
│                                                              │
│  Investment Horizon                                          │
│  ├──────●───────┤  [4] years                               │
│  1           10                                              │
│  Simulation time period for Monte Carlo                     │
│                                                              │
│  Initial Investment                                          │
│  💰 $ [100,000]                                             │
│  Starting capital for simulation                            │
│                                                              │
│  Rebalancing Frequency                                       │
│  [Quarterly ▼]                                              │
│  Options: Monthly, Quarterly, Semi-Annually, Annually       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Field Details:**

| Field | Type | Default | Range | Required | Notes |
|-------|------|---------|-------|----------|-------|
| Number of Holdings | Slider | 25 | 20-30 | Yes | Integer only |
| Investment Horizon | Slider | 4 | 1-10 | Yes | Years |
| Initial Investment | Number Input | 100,000 | 10,000-10,000,000 | Yes | USD |
| Rebalancing Frequency | Dropdown | Quarterly | 4 options | Yes | - |

### **Section 2: Diversification Constraints** (Always Visible)
```
Diversification Rules
Ensure portfolio balance and risk management

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Position Sizing                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Max weight per stock        [5] %                 │    │
│  │  Min weight per stock        [3] %                 │    │
│  │                                                     │    │
│  │  ℹ️ Individual stock limits to prevent over-       │    │
│  │     concentration                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│    │
│                                                              │
│  ☑️ Apply constraints strictly                              │
│  ☐ Allow minor deviations (±2%) for optimization           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Field Details:**

| Field | Type | Default | Range | Validation |
|-------|------|---------|-------|------------|
| Max weight per stock | Number | 5 | 3-10 | Must be > Min weight |
| Min weight per stock | Number | 3 | 1-5 | Must be < Max weight |
| Min industries | Number | 10 | 5-20 | Must be < Holdings |

### **Section 3: Strategy-Specific Parameters** (Conditional)

#### **If Factor-Based is Selected:**
```
Factor-Based Strategy Configuration
Customize factor selection and weighting

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Select Your Factors (Choose 1-2)                           │
│                                                              │
│  Primary Factor (Required)                                   │
│  [Growth ▼]                                                 │
│  ├─ Growth: High revenue/earnings growth                    │
│  ├─ Value: Low P/E, high dividend yield                     │
│  ├─ Quality: Strong fundamentals (ROE, margins)             │
│  └─ Momentum: Price momentum and trends                     │
│                                                              │
│  Secondary Factor (Optional)                                 │
│  [Quality ▼]  ☐ None                                        │
│                                                              │
│  Factor Allocation                                           │
│  Primary: [70]% ├──────●────┤ [30]% :Secondary            │
│          100/0            50/50             0/100            │
│                                                              │
│  Factor Screening Thresholds                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Growth Factor:                                     │    │
│  │    Revenue Growth > [20] % annually                 │    │
│  │    Earnings Growth > [15] % annually                │    │
│  │                                                     │    │
│  │  Quality Factor:                                    │    │
│  │    ROE > [15] %                                     │    │
│  │    Profit Margin > [10] %                           │    │
│  │    Debt-to-Equity < [1.0]                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Factor Options:**

| Factor | Screening Criteria | Customizable? |
|--------|-------------------|---------------|
| Growth | Revenue growth %, Earnings growth % | Yes |
| Value | P/E ratio, P/B ratio, Dividend yield | Yes |
| Quality | ROE %, Profit margin %, Debt/Equity | Yes |
| Momentum | 3/6/12-month returns, Relative strength | Yes |

#### **If Risk-Optimized is Selected:**
```
Risk-Optimized Strategy Configuration
Define optimization objectives and constraints

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Optimization Objective                                      │
│                                                              │
│  ○ Minimize Portfolio Volatility                            │
│     └─ Find lowest-risk portfolio combination               │
│                                                              │
│  ● Maximize Sharpe Ratio                                    │
│     └─ Best risk-adjusted returns                           │
│                                                              │
│  ○ Target Return with Minimum Risk                          │
│     └─ Target Annual Return: [12] %                         │
│        Find minimum volatility to achieve this return       │
│                                                              │
│  ○ Custom Multi-Objective                                   │
│     └─ Return Weight: [60]% vs Risk Weight: [40]%          │
│        Balance between return and risk minimization         │
│                                                              │
│  Advanced Settings                                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ☑️ Allow short positions                           │    │
│  │  ☐ Include transaction costs (0.1% per trade)      │    │
│  │  ☐ Consider tax efficiency                         │    │
│  │  Risk-free rate: [4.5] % (for Sharpe calculation)  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### **If Equal-Weighted is Selected:**
```
Equal-Weighted Strategy Configuration
All stocks receive equal allocation

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Selection Method                                            │
│                                                              │
│  ● Random Selection                                          │
│     └─ Randomly choose from all available stocks            │
│                                                              │
│  ○ Diversified Selection                                     │
│     └─ Ensure representation across all industries          │
│                                                              │
│  ○ Quality-Filtered Random                                   │
│     └─ Only select from stocks meeting quality criteria:    │
│        - Positive earnings                                   │
│        - Minimum market cap: $[1]B                          │
│        - Maximum debt-to-equity: [2.0]                      │
│                                                              │
│  Rebalancing Tolerance                                       │
│  Allow ± [5] % drift before rebalancing                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### **If Cluster-Based is Selected:**
```
Cluster-Based Strategy Configuration
Select representatives from each sub-sector

┌─────────────────────────────────────────────────────────────┐
│  Cluster-Based Strategy Configuration                        │
│  Select representatives from different company types         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Clustering Method                                           │
│  How should we group companies in Software & Services?       │
│                                                              │
│  ● Business Model Clustering (Recommended)                   │
│     └─ Group by revenue model and business type             │
│                                                              │
│  ○ Market Cap Tiers                                          │
│     └─ Group by company size                                │
│                                                              │
│  ○ Geographic Focus                                          │
│     └─ Group by primary market region                       │
│                                                              │
│  ○ Automatic ML Clustering                                   │
│     └─ Algorithm finds natural groupings                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ═══ Business Model Clustering (Selected) ═══                │
│                                                              │
│  Detected Clusters (8 found):                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Cluster Name              | Companies | Avg MC     │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ 📦 SaaS Platforms         | 45        | $12.5B     │    │
│  │ ☁️  Cloud Infrastructure   | 28        | $45.2B     │    │
│  │ 🔒 Cybersecurity          | 22        | $8.3B      │    │
│  │ 💼 Enterprise Software    | 38        | $25.1B     │    │
│  │ 🎮 Gaming & Entertainment | 15        | $6.2B      │    │
│  │ 💳 Fintech Solutions      | 18        | $9.8B      │    │
│  │ 📊 Data & Analytics       | 20        | $15.4B     │    │
│  │ 🤖 AI/ML Platforms        | 15        | $18.7B     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [View Cluster Details]                                      │
│                                                              │
│  Selection Criteria per Cluster                              │
│                                                              │
│  ● Top by Market Cap                                         │
│     └─ Select largest companies from each cluster           │
│                                                              │
│  ○ Best Fundamentals                                         │
│     └─ Highest quality scores (ROE, margins, growth)        │
│                                                              │
│  ○ Balanced Mix                                              │
│     └─ Combine size + quality factors                       │
│                                                              │
│  ○ Random Selection                                          │
│     └─ Randomly pick from each cluster                      │
│                                                              │
│  Distribution Strategy                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ● Equal per Cluster (3 companies × 8 clusters = 24)│    │
│  │                                                     │    │
│  │ ○ Weighted by Cluster Size                         │    │
│  │   └─ Larger clusters get more representation       │    │
│  │                                                     │    │
│  │ ○ Custom Allocation                                │    │
│  │   └─ Manually set companies per cluster            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Total Holdings: 24 stocks                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ═══ Market Cap Tiers (Alternative) ═══                      │
│                                                              │
│  Detected Tiers (4 found):                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Tier              | Range        | Companies       │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ 🏢 Mega-Cap       | >$200B       | 8 companies     │    │
│  │ 🏭 Large-Cap      | $10B-$200B   | 62 companies    │    │
│  │ 🏪 Mid-Cap        | $2B-$10B     | 89 companies    │    │
│  │ 🏠 Small-Cap      | <$2B         | 42 companies    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Companies per Tier:                                         │
│  Mega-Cap:   [3] companies                                  │
│  Large-Cap:  [8] companies                                  │
│  Mid-Cap:    [10] companies                                 │
│  Small-Cap:  [4] companies                                  │
│  ────────────────────                                       │
│  Total:      25 stocks                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ═══ Geographic Focus (Alternative) ═══                      │
│                                                              │
│  Detected Regions (5 found):                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Region              | Companies | Avg MC          │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ 🇺🇸 United States    | 142       | $28.5B          │    │
│  │ 🇨🇳 China            | 35        | $6.2B           │    │
│  │ 🇪🇺 Europe           | 15        | $12.4B          │    │
│  │ 🇮🇱 Israel           | 6         | $8.9B           │    │
│  │ 🌏 Asia-Pacific      | 3         | $5.1B           │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Companies per Region:                                       │
│  US:         [12] companies (48%)                           │
│  China:      [7] companies (28%)                            │
│  Europe:     [4] companies (16%)                            │
│  Israel:     [1] company (4%)                               │
│  APAC:       [1] company (4%)                               │
│  ────────────────────                                       │
│  Total:      25 stocks                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ═══ Automatic ML Clustering (Advanced) ═══                  │
│                                                              │
│  Using K-Means clustering on company characteristics:        │
│  • Market cap, P/E, Growth rates, Profitability             │
│  • Revenue model, Customer base, Technology focus            │
│                                                              │
│  Number of Clusters: [8] (3-15 range)                       │
│                                                              │
│  [Run Clustering Analysis]                                   │
│                                                              │
│  ℹ️ This will analyze all 201 companies and find natural    │
│     groupings based on similar characteristics               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Interactive Behaviors

### **Real-time Validation**

1. **Cross-field validation:**
   - Max weight × Holdings ≥ 100%
   - Min weight × Holdings ≤ 100%
   - Min industries ≤ Number of holdings

2. **Visual feedback:**
   - ✅ Green check when valid
   - ❌ Red error with message
   - ⚠️ Warning for edge cases

3. **Example validation messages:**
   ```
   ❌ Min weight (3%) × Holdings (25) = 75%
      Total must equal 100%. Adjust min weight or holdings.
   
   ⚠️ With 25 holdings and 10 min industries, some industries
      will have multiple stocks. Consider increasing min industries.
   ```

### **Smart Defaults**

When user changes number of holdings, auto-adjust:
- Min weight = 100% / (Holdings × 1.5)
- Max weight = 100% / (Holdings × 0.7)

### **Parameter Presets**

```
Quick Presets
Load pre-configured parameter sets

[Conservative] [Balanced] [Aggressive] [Custom]

Conservative:
- 30 holdings
- Max 3% per stock
- Max 30% per industry
- Quarterly rebalancing

Balanced:
- 25 holdings
- Max 5% per stock
- Max 40% per industry
- Quarterly rebalancing

Aggressive:
- 20 holdings
- Max 8% per stock
- Max 50% per industry
- Monthly rebalancing
```

---

## 💾 Data Requirements for This Page

### **From Previous Page:**
- Selected strategies (array of strategy IDs)
- Sector/Industry context (if coming from sector drill-down)
- Available companies list (filtered by selected sector/industry)

### **From Database:**
For validation and smart defaults:
- Number of available companies
- Number of unique industries in selection
- Industry distribution statistics
- Market cap ranges

### **To Save (User Session):**
```json
{
  "session_id": "uuid",
  "timestamp": "2024-10-09T...",
  "selected_strategies": ["market_cap", "equal_weight", "factor_based"],
  "general_params": {
    "num_holdings": 25,
    "investment_horizon_years": 4,
    "initial_investment": 100000,
    "rebalancing_frequency": "quarterly"
  },
  "diversification_constraints": {
    "max_weight_per_stock": 5,
    "min_weight_per_stock": 3,
    "max_weight_per_industry": 40,
    "min_num_industries": 10,
    "strict_constraints": true
  },
  "strategy_specific": {
    "factor_based": {
      "primary_factor": "growth",
      "secondary_factor": "quality",
      "factor_split": [70, 30],
      "growth_thresholds": {
        "revenue_growth_pct": 20,
        "earnings_growth_pct": 15
      },
      "quality_thresholds": {
        "roe_pct": 15,
        "profit_margin_pct": 10,
        "debt_to_equity_max": 1.0
      }
    },
    "risk_optimized": null,
    "equal_weight": null
  }
}
```

---

## 🎯 Buttons & Navigation

### **Bottom Action Bar**
```
┌─────────────────────────────────────────────────────────────┐
│  [← Back to Strategies]         [Build Funds & Simulate →]  │
│                                                              │
│  Estimated construction time: ~30 seconds                    │
└─────────────────────────────────────────────────────────────┘
```

**"Build Funds & Simulate" Button:**
- Disabled until all required fields valid
- Shows loading spinner when clicked
- Tooltip: "This will construct your funds and prepare them for simulation"

---

## ⚡ Backend Processing (When User Clicks "Build")

### **API Endpoint:**
```
POST /api/fund-simulation/build-funds

Request Body:
{
  "strategies": [...],
  "params": {...},
  "sector_filter": "Information Technology" (optional)
}

Response:
{
  "job_id": "uuid",
  "status": "processing",
  "estimated_time_seconds": 30,
  "funds_to_build": 3
}
```

### **Processing Steps:**
1. **Fetch company data** from database (filtered by sector if applicable)
2. **For each selected strategy:**
   - Apply selection algorithm
   - Apply diversification constraints
   - Calculate weights
   - Generate holdings list
3. **Calculate fund statistics:**
   - Total market cap
   - Sector/industry distribution
   - Average P/E, dividend yield
   - Top 5 concentration
4. **Save constructed funds** to database
5. **Return fund IDs** for next page

---

## 🧪 Testing Scenarios

### **Edge Cases to Handle:**
1. User selects 0 strategies (shouldn't reach this page)
2. Not enough companies to meet min industries constraint
3. Conflicting constraints (impossible to satisfy)
4. Very small/large initial investment amounts
5. Factor thresholds too strict (no companies qualify)
6. Network timeout during construction
7. User navigates away mid-construction

### **Error Messages:**
```
❌ Unable to build funds

Reason: Not enough companies meet your factor criteria.
- Current filters would select only 12 companies
- You requested 25 holdings

Suggestions:
• Relax factor thresholds
• Reduce number of holdings
• Choose different primary/secondary factors
```

---

## 📱 Responsive Design Notes

### **Desktop (>1200px):**
- 2-column layout for strategy-specific sections
- All parameters visible at once

### **Tablet (768px - 1200px):**
- Single column
- Collapsible sections for strategy-specific params

### **Mobile (<768px):**
- Stack all sections vertically
- Sliders become number inputs with +/- buttons
- Fixed bottom navigation bar

---

## 🎨 UI Component Library Needs

### **Components Required:**
- Range Slider with min/max labels
- Number input with validation
- Dropdown/Select with search
- Radio button groups
- Checkbox with label
- Info tooltips (ℹ️ icon)
- Collapsible sections
- Tag/Chip for selected strategies (removable)
- Progress indicator
- Error/Warning alerts
- Sticky footer buttons

### **Colors & States:**
- Primary action: Teal (#00917C)
- Secondary: Dark teal (#055A57)
- Success: Green
- Error: Red
- Warning: Orange/Yellow
- Disabled: Gray

---

## ✅ Acceptance Criteria

**Page is complete when:**
- [ ] All parameter inputs functional
- [ ] Real-time validation working
- [ ] Strategy-specific sections show/hide correctly
- [ ] Smart defaults calculate properly
- [ ] Presets load correctly
- [ ] Error messages clear and actionable
- [ ] Build button triggers API correctly
- [ ] Loading state displays during construction
- [ ] Session data saves properly
- [ ] Page navigates to Fund Results on success
- [ ] Responsive on all screen sizes
- [ ] Accessible (keyboard navigation, screen readers)

---

# Page 4: Fund Parameters - Component Prompts

## PROMPT 1: Page Header Component

```
Create a header component for the Fund Parameters page with:

REQUIREMENTS:
- Title: "Configure Your Funds"
- Display selected strategies as removable chips/tags
- Each chip shows strategy name with icon
- X button on each chip to remove it
- Counter showing "Selected Strategies (X):"

DESIGN:
- Background: Dark blue (#2C3E50)
- Chips: Teal (#00917C) with white text
- Icons: 🏢 (Market-Cap), ⚖️ (Equal), 📈 (Factor), 🎯 (Risk), 📊 (Cluster)

STATE:
selectedStrategies: ['market_cap', 'equal_weight', 'factor_based']

FUNCTIONS:
- removeStrategy(strategyId) - removes a strategy from selection
- If all strategies removed, show warning: "Please select at least one strategy"

PROPS:
- selectedStrategies: array of strategy IDs
- onRemoveStrategy: callback function
```

---

## PROMPT 2: General Parameters Section

```
Create the General Parameters section component with 4 input fields:

FIELDS:
1. Number of Holdings
   - Type: Range slider (20-30)
   - Default: 25
   - Show current value next to slider
   - Integer steps only

2. Investment Horizon
   - Type: Range slider (1-10 years)
   - Default: 4
   - Show "years" label

3. Initial Investment
   - Type: Number input with $ prefix
   - Default: $100,000
   - Range: $10,000 - $10,000,000
   - Format with commas (e.g., $100,000)
   - Show validation on blur

4. Rebalancing Frequency
   - Type: Dropdown select
   - Options: Monthly, Quarterly, Semi-Annually, Annually
   - Default: Quarterly

VALIDATION:
- All fields required
- Initial Investment must be >= $10,000
- Show green checkmark when valid
- Show red error when invalid

STATE MANAGEMENT:
generalParams: {
  num_holdings: 25,
  investment_horizon: 4,
  initial_investment: 100000,
  rebalancing_frequency: 'quarterly'
}

STYLING:
- Section title: "General Parameters"
- Subtitle: "Applied to all selected funds"
- Use card/box with light background
- Responsive: Stack vertically on mobile
```

---

## PROMPT 3: Diversification Constraints Section

```
Create the Diversification Constraints section with:

FIELDS:
1. Position Sizing Box:
   - Max weight per stock: Number input (3-10%)
   - Min weight per stock: Number input (1-5%)
   - Info tooltip: "Individual stock limits to prevent over-concentration"

2. Checkboxes:
   - ☑️ "Apply constraints strictly"
   - ☐ "Allow minor deviations (±2%) for optimization"

VALIDATION LOGIC:
- Max weight must be > Min weight
- Show error if violated
- Real-time validation on change

SMART CALCULATION:
When num_holdings changes, auto-suggest:
- Min weight = 100 / (holdings × 1.5)
- Max weight = 100 / (holdings × 0.7)
- Show suggestion tooltip

CROSS-FIELD VALIDATION:
Calculate and show warning if:
- Max weight × Holdings < 100%
- Min weight × Holdings > 100%

ERROR MESSAGES:
"❌ Constraints don't add up to 100%. Adjust min/max weights."

STATE:
constraints: {
  max_weight_per_stock: 5,
  min_weight_per_stock: 3,
  strict_constraints: true,
  allow_deviations: false
}
```

---

## PROMPT 4: Factor-Based Configuration (Conditional)

```
Create Factor-Based strategy configuration component:
(Only show if 'factor_based' is in selectedStrategies)

SECTIONS:

1. Factor Selection:
   - Primary Factor dropdown (required)
     Options: Growth, Value, Quality, Momentum
   - Secondary Factor dropdown (optional)
     Options: Growth, Value, Quality, Momentum, None
     Checkbox: ☐ None

2. Factor Allocation Slider:
   - Range slider 0-100
   - Shows Primary % on left, Secondary % on right
   - Labels: "100/0", "50/50", "0/100"
   - Current position shows as: "Primary: [70]% | Secondary: [30]%"
   - Disable if Secondary = None

3. Factor Thresholds (Expandable sections):
   
   Growth Factor (if selected):
   - Revenue Growth > [20]% annually (slider 0-50)
   - Earnings Growth > [15]% annually (slider 0-50)
   
   Value Factor (if selected):
   - P/E Ratio < [20]x (slider 5-50)
   - P/B Ratio < [5]x (slider 1-10)
   - Dividend Yield > [2]% (slider 0-10)
   
   Quality Factor (if selected):
   - ROE > [15]% (slider 0-50)
   - Profit Margin > [10]% (slider 0-30)
   - Debt-to-Equity < [1.0] (slider 0-3)
   
   Momentum Factor (if selected):
   - 6-Month Return > [10]% (slider 0-50)
   - Relative Strength > [50] (slider 0-100)

VALIDATION:
- Check how many companies qualify
- Show count: "✓ 45 companies meet these criteria"
- Warning if < num_holdings

STATE:
factorConfig: {
  primary_factor: 'growth',
  secondary_factor: 'quality',
  factor_split: [70, 30],
  growth_thresholds: { revenue_growth: 20, earnings_growth: 15 },
  quality_thresholds: { roe: 15, profit_margin: 10, debt_to_equity: 1.0 }
}
```

---

## PROMPT 5: Risk-Optimized Configuration (Conditional)

```
Create Risk-Optimized strategy configuration:
(Only show if 'risk_optimized' is in selectedStrategies)

SECTIONS:

1. Optimization Objective (Radio buttons):
   ○ Minimize Portfolio Volatility
      Description: "Find lowest-risk portfolio combination"
   
   ● Maximize Sharpe Ratio (default)
      Description: "Best risk-adjusted returns"
   
   ○ Target Return with Minimum Risk
      Description: "Target Annual Return: [12]%"
      Show number input if selected
   
   ○ Custom Multi-Objective
      Description: "Return Weight: [60]% vs Risk Weight: [40]%"
      Show two sliders that sum to 100%

2. Advanced Settings (Collapsible):
   Checkboxes:
   ☐ Allow short positions
   ☐ Include transaction costs (0.1% per trade)
   ☐ Consider tax efficiency
   
   Number Input:
   Risk-free rate: [4.5]% (for Sharpe calculation)
   Range: 0-10%

STYLING:
- Radio buttons with descriptions underneath
- Conditional inputs appear smoothly
- Advanced settings collapsed by default

STATE:
riskOptimizedConfig: {
  objective: 'max_sharpe',
  target_return: 12,
  return_weight: 60,
  risk_weight: 40,
  allow_short: false,
  transaction_costs: false,
  tax_efficiency: false,
  risk_free_rate: 4.5
}
```

---

## PROMPT 6: Equal-Weighted Configuration (Conditional)

```
Create Equal-Weighted strategy configuration:
(Only show if 'equal_weight' is in selectedStrategies)

SECTIONS:

1. Selection Method (Radio buttons):
   ● Random Selection
      "Randomly choose from all available stocks"
   
   ○ Diversified Selection
      "Ensure representation across all company types"
   
   ○ Quality-Filtered Random
      "Only select from stocks meeting quality criteria:"
      Show sub-options when selected:
      - Positive earnings
      - Minimum market cap: $[1]B (input)
      - Maximum debt-to-equity: [2.0] (input)

2. Rebalancing Tolerance:
   - Slider: Allow ± [5]% drift before rebalancing
   - Range: 1-20%
   - Show percentage

STYLING:
- Simple, clean layout
- Sub-options indent when parent selected
- Tooltips for each option

STATE:
equalWeightConfig: {
  selection_method: 'random',
  quality_filter: {
    enabled: false,
    min_market_cap: 1000000000,
    max_debt_to_equity: 2.0
  },
  rebalancing_tolerance: 5
}
```

---

## PROMPT 7: Cluster-Based Configuration (Conditional)

```
Create Cluster-Based strategy configuration:
(Only show if 'cluster_based' is in selectedStrategies)

SECTIONS:

1. Clustering Method (Radio buttons):
   ● Business Model Clustering (Recommended)
      "Group by revenue model and business type"
   
   ○ Market Cap Tiers
      "Group by company size"
   
   ○ Geographic Focus
      "Group by primary market region"
   
   ○ Automatic ML Clustering
      "Algorithm finds natural groupings"

2. Conditional Display Based on Selection:

   IF Business Model:
   - Show detected clusters table
   - Columns: Cluster Name, Companies, Avg MC
   - 8 clusters with emojis (📦 SaaS, ☁️ Cloud, 🔒 Security, etc.)
   - [View Cluster Details] button
   
   IF Market Cap Tiers:
   - Show 4 tiers table
   - Mega-Cap (>$200B), Large-Cap ($10B-$200B)
   - Mid-Cap ($2B-$10B), Small-Cap (<$2B)
   - Sliders for companies per tier
   - Show total sum
   
   IF Geographic:
   - Show regions table with flags
   - 🇺🇸 US, 🇨🇳 China, 🇪🇺 Europe, 🇮🇱 Israel, 🌏 APAC
   - Sliders for companies per region
   
   IF ML Clustering:
   - Number of Clusters slider (3-15)
   - [Run Clustering Analysis] button
   - Show loading state when running

3. Selection Criteria (All methods):
   Radio buttons:
   ● Top by Market Cap
   ○ Best Fundamentals
   ○ Balanced Mix
   ○ Random Selection

4. Distribution Strategy:
   Radio buttons:
   ● Equal per Cluster (X companies × Y clusters = Z total)
   ○ Weighted by Cluster Size
   ○ Custom Allocation

VALIDATION:
- Calculate total holdings dynamically
- Show warning if total ≠ general.num_holdings
- Allow user to adjust

STATE:
clusterConfig: {
  method: 'business_model',
  selection_criteria: 'market_cap',
  distribution: 'equal',
  num_clusters: 8,
  companies_per_cluster: 3
}
```

---

## PROMPT 8: Parameter Presets Component

```
Create a Quick Presets section with 3 preset buttons:

PRESETS:

1. [Conservative]
   - 30 holdings
   - Max 3% per stock
   - Min 2% per stock
   - Quarterly rebalancing

2. [Balanced] (Default)
   - 25 holdings
   - Max 5% per stock
   - Min 3% per stock
   - Quarterly rebalancing

3. [Aggressive]
   - 20 holdings
   - Max 8% per stock
   - Min 4% per stock
   - Monthly rebalancing

BEHAVIOR:
- Click a preset button to load its values
- All parameters update immediately
- Show confirmation toast: "✓ Loaded Balanced preset"
- Current preset highlighted in teal
- [Custom] badge appears when user changes any value

STYLING:
- Horizontal button row at top of page
- Icons: 🛡️ Conservative, ⚖️ Balanced, 🚀 Aggressive
- Active preset has border and background color

FUNCTION:
loadPreset(presetName) {
  // Update all state with preset values
  // Trigger validation
  // Show toast notification
}
```

---

## PROMPT 9: Real-Time Validation Component

```
Create a validation overlay that shows live validation messages:

VALIDATION RULES:

1. Weight Constraints:
   maxTotal = num_holdings × max_weight_per_stock
   minTotal = num_holdings × min_weight_per_stock
   
   Errors:
   - If maxTotal < 100: "Max weight too low"
   - If minTotal > 100: "Min weight too high"
   - If max ≤ min: "Max must be greater than min"

2. Factor Validation:
   - Query DB: How many companies meet thresholds?
   - If count < num_holdings: Warning with suggestion

3. Cluster Validation:
   - Total holdings must match general.num_holdings
   - Each cluster must have at least 1 company

DISPLAY:
- Sticky validation panel on right side
- Show as list of checks/warnings/errors
- Icons: ✓ (green), ⚠️ (yellow), ❌ (red)
- Click on error to scroll to relevant field

EXAMPLE:
┌────────────────────────────┐
│ Validation Status          │
├────────────────────────────┤
│ ✓ General parameters valid │
│ ✓ Constraints valid        │
│ ⚠️ Only 18 companies meet  │
│   factor criteria (need 25)│
│ ✓ No conflicts detected    │
└────────────────────────────┘

STATE:
validationErrors: [],
validationWarnings: [],
isValid: boolean
```

---

## PROMPT 10: Bottom Navigation Bar

```
Create a sticky bottom navigation bar with:

ELEMENTS:
- [← Back to Strategies] button (left)
- [Build Funds & Simulate →] button (right)
- Status text: "Estimated construction time: ~30 seconds"

BEHAVIOR:
- "Build" button DISABLED if validation fails
- Show tooltip on hover explaining why disabled
- Loading spinner appears when clicked
- Prevent double-click

STYLING:
- Sticky position at bottom
- Full width with padding
- Background: Dark with slight transparency
- Back button: Secondary style (outline)
- Build button: Primary style (teal, solid)
- Disabled state: Gray with cursor not-allowed

STATES:
- isValid: boolean (from validation)
- isBuilding: boolean (loading state)

FUNCTION:
async function handleBuildFunds() {
  setIsBuilding(true);
  
  try {
    const response = await buildFunds({
      strategies: selectedStrategies,
      params: {
        general: generalParams,
        constraints: constraints,
        factor: factorConfig,
        risk: riskOptimizedConfig,
        equal: equalWeightConfig,
        cluster: clusterConfig
      }
    });
    
    // Navigate to loading/results page
    router.push(`/fund-simulation/building/${response.job_id}`);
  } catch (error) {
    showError(error.message);
    setIsBuilding(false);
  }
}
```

---

## PROMPT 11: Strategy-Specific Section Container

```
Create a container component that conditionally renders strategy configs:

LOGIC:
{selectedStrategies.includes('factor_based') && (
  <FactorBasedConfig />
)}

{selectedStrategies.includes('risk_optimized') && (
  <RiskOptimizedConfig />
)}

{selectedStrategies.includes('equal_weight') && (
  <EqualWeightConfig />
)}

{selectedStrategies.includes('cluster_based') && (
  <ClusterBasedConfig />
)}

STYLING:
- Each config in collapsible/expandable card
- Smooth transitions when showing/hiding
- Visual separator between configs
- Can collapse to save space

TITLE FORMAT:
"[Strategy Icon] [Strategy Name] Configuration"

PROPS:
- selectedStrategies: array
- configs: object with all strategy configs
- onConfigChange: callback function
```

---

## PROMPT 12: Page State Management

```
Create the main page state management structure:

STATE SHAPE:
const [pageState, setPageState] = useState({
  // From route/props
  industry: 'Software & Services',
  sector: 'Information Technology',
  selectedStrategies: ['market_cap', 'equal_weight'],
  
  // General params
  generalParams: {
    num_holdings: 25,
    investment_horizon: 4,
    initial_investment: 100000,
    rebalancing_frequency: 'quarterly'
  },
  
  // Constraints
  constraints: {
    max_weight_per_stock: 5,
    min_weight_per_stock: 3,
    strict_constraints: true,
    allow_deviations: false
  },
  
  // Strategy-specific configs
  strategyConfigs: {
    factor_based: {...},
    risk_optimized: {...},
    equal_weight: {...},
    cluster_based: {...}
  },
  
  // UI state
  validation: {
    isValid: false,
    errors: [],
    warnings: []
  },
  
  isBuilding: false
});

FUNCTIONS:
- updateGeneralParams(field, value)
- updateConstraints(field, value)
- updateStrategyConfig(strategy, field, value)
- validateAll()
- buildFunds()

SIDE EFFECTS:
- Save to sessionStorage on change
- Validate on any change
- Update smart defaults when num_holdings changes
```

---

## PROMPT 13: Responsive Layout Container

```
Create the responsive page layout:

DESKTOP (>1200px):
┌─────────────────────────────────────┐
│ Header                              │
├──────────────────┬──────────────────┤
│ General Params   │ Validation Panel │
│ Constraints      │                  │
│ Strategy Configs │                  │
└──────────────────┴──────────────────┘
│ Bottom Nav                          │
└─────────────────────────────────────┘

TABLET (768-1200px):
- Single column
- Validation panel below params
- Collapsible sections

MOBILE (<768px):
- All stacked vertically
- Sliders become +/- number inputs
- Bottom nav becomes fixed
- Reduce padding/spacing

BREAKPOINTS:
const breakpoints = {
  mobile: '768px',
  tablet: '1200px',
  desktop: '1201px'
};

GRID:
- Use CSS Grid or Flexbox
- Max-width: 1400px
- Center container
- Responsive padding
```

---

## IMPLEMENTATION ORDER

1. ✅ Start with Page State Management (PROMPT 12)
2. ✅ Create Page Header (PROMPT 1)
3. ✅ Build General Parameters (PROMPT 2)
4. ✅ Add Diversification Constraints (PROMPT 3)
5. ✅ Implement Validation Component (PROMPT 9)
6. ✅ Add Parameter Presets (PROMPT 8)
7. ✅ Create Strategy Container (PROMPT 11)
8. ✅ Build each strategy config (PROMPTS 4-7)
9. ✅ Add Bottom Navigation (PROMPT 10)
10. ✅ Wrap in Responsive Layout (PROMPT 13)
11. ✅ Test & Polish

---

## TESTING CHECKLIST

- [ ] All validations work correctly
- [ ] Presets load properly
- [ ] Strategy configs show/hide based on selection
- [ ] Smart defaults calculate correctly
- [ ] Cross-field validation catches conflicts
- [ ] Build button enables/disables appropriately
- [ ] Mobile responsive works
- [ ] State persists in sessionStorage
- [ ] Error messages are clear
- [ ] Tooltips are helpful
- [ ] Smooth transitions
- [ ] Accessibility (keyboard nav, screen readers)