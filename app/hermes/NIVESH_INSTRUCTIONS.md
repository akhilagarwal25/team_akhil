# NIVESH - Personal Stock Analyst

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH - The Stock Analyst
            Nivesh = Investment - Grow Wealth Wisely
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROLE: Personal Stock Analyst
REPORTS TO: Dhan (Finance Head)
SYNERGY: Works with Gyan (data), Dhan (approval)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH RESPONSIBILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. TECHNICAL ANALYSIS
   - RSI, MACD, Moving Averages
   - Support/Resistance levels
   - Trend identification

2. FUNDAMENTAL ANALYSIS
   - Company financials (via Perplexity)
   - Sector trends
   - PE ratios, EPS

3. SWING TRADE RECOMMENDATIONS
   - 5-15 day trades
   - Entry/exit points
   - Stop loss levels
   - Target prices

4. PORTFOLIO TRACKING
   - Track recommendations
   - Performance metrics
   - Alert on price movements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────┐
│                    NIVESH SYSTEM                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOCAL MACHINE (SmartAPI Access)                                │
│  ┌─────────────────────┐                                        │
│  │ nivesh_local.py    │                                        │
│  │ - Fetches live data │                                        │
│  │ - Stores to SQLite  │                                        │
│  │ - Pushes to Hermes  │                                        │
│  └─────────────────────┘                                        │
│            │                                                      │
│            ▼                                                      │
│  ┌─────────────────────┐                                        │
│  │ SmartAPI (Angel One)│                                        │
│  │ Live NSE/BSE data   │                                        │
│  └─────────────────────┘                                        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HERMES SERVER (No SmartAPI)                                    │
│  ┌─────────────────────┐                                        │
│  │ nivesh_data.py      │                                        │
│  │ - yfinance fallback │                                        │
│  │ - Nifty 200 stocks │                                        │
│  └─────────────────────┘                                        │
│            │                                                      │
│            ▼                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │ nivesh_technical.py │  │ nivesh_trading.py   │             │
│  │ - pandas-ta         │  │ - Swing trades      │             │
│  │ - Indicators        │  │ - Recommendations    │             │
│  └─────────────────────┘  └─────────────────────┘             │
│            │                                                      │
│            ▼                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │ nivesh_research.py  │  │ nivesh_tracker.py   │             │
│  │ - Perplexity Sonar  │  │ - Portfolio track    │             │
│  │ - News sentiment    │  │ - Performance       │             │
│  └─────────────────────┘  └─────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH DATA SOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SMARTAPI (Local Machine)
   - Live NSE/BSE prices
   - Real-time LTP
   - Historical candles
   - Market depth

2. YFINANCE (Server Fallback)
   - Historical data
   - Company info
   - Free backup

3. PERPLEXITY SONAR (Research)
   - Real-time news
   - Sentiment analysis
   - Company fundamentals
   - Sector trends

4. PANDAS-TA (Technical Analysis)
   - RSI (14, 7)
   - SMA/EMA (20, 50, 200)
   - MACD + Signal
   - Bollinger Bands
   - ATR, Stochastic, ADX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOCAL MACHINE:
/scripts/nivesh_local.py      - SmartAPI data fetcher
/scripts/nivesh_technical.py  - Technical analysis
/scripts/nivesh_trading.py    - Swing trade logic
/scripts/nivesh_tracker.py    - Portfolio tracking

SERVER (Hermes):
/app/lib/nivesh-data.ts       - Stock data + Nifty 200
/app/lib/nivesh.ts            - SmartAPI wrapper
/app/lib/nivesh-research.ts   - Perplexity research
/app/api/nivesh/*            - API endpoints

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH API ENDPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET /api/nivesh/stocks?action=list     - List all stocks
GET /api/nivesh/stocks?action=sectors   - List sectors
GET /api/nivesh/stocks?action=sector&sector=IT
GET /api/nivesh/analyze?symbol=RELIANCE - Full analysis
GET /api/nivesh/research?symbol=RELIANCE - Research
GET /api/nivesh/trade?symbol=RELIANCE   - Swing trade
GET /api/nivesh/performance             - Track record

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH SWING TRADE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommendation:
{
  "symbol": "RELIANCE",
  "price": 1320,
  "recommendation": "BUY",
  "confidence": 75,
  "entry": { "min": 1318, "max": 1322 },
  "target_1": 1360,
  "target_2": 1400,
  "stop_loss": 1290,
  "risk_reward": 2,
  "timeframe": "5-15 days"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH STOCKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nifty 200 Coverage:
- Auto & Ancillaries (12 stocks)
- Banks & Financials (20 stocks)
- IT & Tech (10 stocks)
- FMCG & Consumer (10 stocks)
- Pharma (10 stocks)
- Metals & Mining (8 stocks)
- Power & Energy (8 stocks)
- Construction (5 stocks)
- Telecom & Media (3 stocks)
- Retail & Textiles (4 stocks)

Total: 90+ stocks tracked

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH × DHAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Weekly Report to Dhan:
{
  "accuracy": 65,
  "wins": 8,
  "losses": 4,
  "avg_gain": 8.5,
  "avg_loss": 4.2,
  "recommendation": "Continue strategy"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH OPENROUTER MODELS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Research Models (OpenRouter):
- perplexity/sonar - Fast search
- perplexity/sonar-reasoning - Reasoning
- perplexity/sonar-deep-research - Deep research
- deepseek/deepseek-v4-flash - Fast analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    NIVESH TRACKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Performance Metrics:
- Accuracy % (wins / total)
- Avg gain on wins
- Avg loss on stops
- Win/Loss ratio
- Expected return

Trade Rules:
- Max loss per trade: 5%
- Min risk/reward: 1:2
- Max concurrent trades: 3
- Max investment per trade: ₹10,000
