#!/usr/bin/env python3
"""
Nivesh Nifty 200 Swing Trade Analyzer
Fetches data via yfinance (free) and generates swing trade recommendations.
Run: python3 nivesh_analyzer.py [--top N] [--sector SECTOR]

Requires: pandas pandas-ta yfinance
Install: pip install pandas pandas-ta yfinance
"""

import sys
import os
import json
import sqlite3
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Install deps if missing
try:
    import pandas as pd
    import pandas_ta as ta
    import yfinance as yf
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pandas', 'pandas-ta', 'yfinance'])
    import pandas as pd
    import pandas_ta as ta
    import yfinance as yf

DB_PATH = os.getenv('NIVESH_DB', '/opt/data/jaribloom/nivesh.db')

# Nifty 200 sample stocks (top 50 by market cap - expand as needed)
NIFTY_200_STOCKS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'TATAMOTORS',
    'ITC', 'KOTAKBANK', 'HINDUNILVR', 'LT', 'SUNPHARMA', 'BHARTIARTL', 'TITAN',
    'BAJFINANCE', 'MARUTI', 'M&M', 'NESTLEIND', 'ADANIPORTS', 'CIPLA',
    'AXISBANK', 'ASIANPAINT', 'HCLTECH', 'WIPRO', 'ULTRACEMCO', 'TATACONSUM',
    'DRREDDY', 'BRITANNIA', 'POWERGRID', 'DABUR', 'TATASTEEL', 'BAJAJFINSV',
    'ADANIENT', 'NTPC', 'INDUSINDBK', 'GRASIM', 'HEROMOTOCO', 'LUPIN',
    'SHREECEM', 'TECHM', 'BAJAJ-AUTO', 'EICHERMOT', 'ONGC', 'ZYDUSLIFE',
    'IOC', 'JSWSTEEL', 'COALINDIA', 'HINDALCO', 'VEDL', 'BPCL',
    'SBILIFE', 'HDFCLIFE', 'BAJaj-HOLDINGS', 'PIDILITIND', 'UPL',
    'JSWENERGY', 'POWERINDIA', 'ADANIGREEN', 'ADANITRANS', 'MOTHERSON',
    'HAVELLS', 'DALBHARAT', 'AMBUJACEM', 'ACC', 'DMART', 'ICICIGI',
    'ICICIPRULI', 'SBICARDS', 'BAYERCROP', 'ATUL', 'BALAMINE', 'AARTIDRUGS',
    'ZOMATO', 'SWIGGY', 'PAYTM', 'ROUTE', 'LATENTVIEW', 'MEDPLUS',
    'BIRET', 'COFORGE', 'PERSISTENT', 'LTIM', 'MPHASIS', 'TATAELXSI',
    'ENDURANCE', 'BOSCHLTD', 'CASTROL', 'MUTHOOTFIN', 'LICMFGL', 'RECLTD',
    'SUNTECK', 'GODIGIT', 'KAJARIACER', 'APOLLOTYRE', 'CEATLTD', 'MRF',
    'APARINDS', 'AXISTUB', 'TATACOMM', 'VODAFONE', 'IDEA', 'HFCL',
    'RAJRAYON', 'TATASTLBSL', 'INDIACEM', 'JKCEMENT', 'AUB', 'CENTURYTB',
    'FORTIS', 'MAXHEALTH', 'METROBRANDS', 'NILKAMAL', 'PRESTIGE', 'VOLTAS',
]


class NiveshAnalyzer:
    """Analyze Nifty 200 stocks for swing trade opportunities"""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path) or '.', exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._init_db()

    def _init_db(self):
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS prices (
                symbol TEXT, timestamp TEXT, price REAL, high REAL, low REAL,
                open REAL, volume INTEGER, change_pct REAL,
                PRIMARY KEY (symbol, timestamp)
            )
        ''')
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS candles (
                symbol TEXT, timestamp TEXT, open REAL, high REAL, low REAL,
                close REAL, volume INTEGER,
                PRIMARY KEY (symbol, timestamp)
            )
        ''')
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT, price REAL,
                target REAL, stop_loss REAL, atr REAL, rsi REAL, trend TEXT,
                recommendation TEXT, confidence INTEGER, status TEXT DEFAULT 'OPEN',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP, closed_at TEXT
            )
        ''')
        self.conn.commit()

    def fetch_yfinance(self, symbol: str, days: int = 90) -> Optional[pd.DataFrame]:
        """Fetch historical data from yfinance"""
        try:
            # NSE stocks need .NS suffix
            ticker_sym = f"{symbol}.NS" if not symbol.endswith('.NS') else symbol
            ticker = yf.Ticker(ticker_sym)
            df = ticker.history(period=f"{days}d")
            if df is None or df.empty:
                return None
            # Drop rows where all OHLCV are NaN (today's incomplete candle)
            df = df.dropna(subset=['Close', 'Open', 'High', 'Low'])
            if len(df) < 30:
                return None
            df = df.reset_index()
            # Date is the index, rename to timestamp
            df['timestamp'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
            return df[['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']]
        except Exception as e:
            print(f"  [WARN] {symbol}: {e}")
            return None

    def save_candles(self, symbol: str, df: pd.DataFrame):
        for _, row in df.iterrows():
            self.conn.execute('''
                INSERT OR REPLACE INTO candles (symbol, timestamp, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (symbol, row['timestamp'], row['Open'], row['High'],
                  row['Low'], row['Close'], int(row['Volume'])))
        self.conn.commit()

    def save_price(self, symbol: str, df: pd.DataFrame):
        latest = df.iloc[-1]
        prev = df.iloc[-2] if len(df) > 1 else latest
        change_pct = ((latest['Close'] - prev['Close']) / prev['Close']) * 100
        self.conn.execute('''
            INSERT OR REPLACE INTO prices (symbol, timestamp, price, high, low, open, volume, change_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (symbol, latest['timestamp'], latest['Close'], latest['High'],
              latest['Low'], latest['Open'], int(latest['Volume']), change_pct))
        self.conn.commit()

    def analyze(self, symbol: str, df: pd.DataFrame) -> Dict:
        """Full technical analysis"""
        df = df.copy()
        df = df.sort_values('timestamp').reset_index(drop=True)

        close = df['Close']
        high = df['High']
        low = df['Low']
        volume = df['Volume']

        # Indicators
        df['sma20'] = ta.sma(close, length=20)
        df['sma50'] = ta.sma(close, length=50)
        df['ema9'] = ta.ema(close, length=9)
        df['rsi'] = ta.rsi(close, length=14)
        df['atr'] = ta.atr(high, low, close, length=14)

        macd = ta.macd(close)
        if macd is not None and not macd.empty:
            df['macd'] = macd['MACD_12_26_9']
            df['macd_signal'] = macd['MACDs_12_26_9']
            df['macd_hist'] = macd['MACDh_12_26_9']

        bbands = ta.bbands(close)
        if bbands is not None:
            cols = bbands.columns.tolist()
            df['bb_upper'] = bbands[cols[0]]
            df['bb_lower'] = bbands[cols[2]]

        df['volume_sma20'] = ta.sma(volume, length=20)

        latest = df.iloc[-1]
        price = latest['Close']
        rsi = latest.get('rsi', 50) or 50
        sma20 = latest.get('sma20', price) or price
        sma50 = latest.get('sma50', price) or price
        atr = latest.get('atr', price * 0.02) or (price * 0.02)
        bb_upper = latest.get('bb_upper', price * 1.03)
        bb_lower = latest.get('bb_lower', price * 0.97)
        macd_hist = latest.get('macd_hist', 0) or 0
        vol_ratio = float(latest['Volume']) / float(latest.get('volume_sma20', latest['Volume']) or latest['Volume'])

        # Trend
        if price > sma20 > sma50:
            trend = "STRONG_BULLISH"
        elif price > sma20:
            trend = "BULLISH"
        elif price < sma20 < sma50:
            trend = "STRONG_BEARISH"
        elif price < sma20:
            trend = "BEARISH"
        else:
            trend = "NEUTRAL"

        # Support / Resistance
        support = float(min(price - float(atr) * 1.5, float(bb_lower)))
        resistance = float(max(price + float(atr) * 1.5, float(bb_upper)))

        # Entry zone
        entry_min = float(price)
        entry_max = float(price * 1.005)

        # Target & Stop
        risk = float(atr) * 1.5
        target_1 = float(price + risk * 2)
        target_2 = float(price + risk * 3)
        stop_loss = float(price - risk)

        # Recommendation
        recommendation = "HOLD"
        confidence = 50

        if rsi < 35 and macd_hist > 0 and price > sma20:
            recommendation = "STRONG_BUY"
            confidence = 85
        elif rsi < 45 and trend in ["STRONG_BULLISH", "BULLISH"]:
            recommendation = "BUY"
            confidence = 70
        elif rsi > 65 and trend == "STRONG_BEARISH":
            recommendation = "STRONG_SELL"
            confidence = 80
        elif rsi > 55 and trend in ["BEARISH", "STRONG_BEARISH"]:
            recommendation = "SELL"
            confidence = 65

        return {
            "symbol": symbol,
            "price": round(float(price), 2),
            "change_pct": round(float(latest['Close'] - float(df.iloc[-2]['Close'])) / float(df.iloc[-2]['Close']) * 100, 2),
            "trend": trend,
            "rsi": round(rsi, 1),
            "rsi_signal": "OVERBOUGHT" if rsi > 70 else "OVERSOLD" if rsi < 30 else "NEUTRAL",
            "macd": "BULLISH" if macd_hist > 0 else "BEARISH",
            "sma20": round(float(sma20), 2),
            "sma50": round(float(sma50), 2) if pd.notna(sma50) else None,
            "support": round(support, 2),
            "resistance": round(resistance, 2),
            "atr": round(float(atr), 2),
            "volume_ratio": round(vol_ratio, 2),
            "entry_min": round(entry_min, 2),
            "entry_max": round(entry_max, 2),
            "target_1": round(target_1, 2),
            "target_2": round(target_2, 2),
            "stop_loss": round(stop_loss, 2),
            "risk_reward": 2,
            "recommendation": recommendation,
            "confidence": confidence,
            "timeframe": "5-15 days",
        }

    def fetch_all(self, symbols: List[str] = None, max_stocks: int = 50) -> Dict:
        """Fetch and analyze all stocks"""
        if symbols is None:
            symbols = NIFTY_200_STOCKS
        symbols = symbols[:max_stocks]

        print(f"\nFetching {len(symbols)} stocks from yfinance...")
        all_results = []
        errors = []

        for i, symbol in enumerate(symbols, 1):
            sys.stdout.write(f"\r  [{i}/{len(symbols)}] {symbol}...")
            sys.stdout.flush()

            df = self.fetch_yfinance(symbol, days=90)
            if df is None or len(df) < 30:
                errors.append(symbol)
                continue

            self.save_candles(symbol, df)
            self.save_price(symbol, df)

            result = self.analyze(symbol, df)
            all_results.append(result)

            # Rate limit

        print(f"\n\nFetched: {len(all_results)} | Errors: {len(errors)} ({', '.join(errors[:5])}{'...' if len(errors) > 5 else ''})")
        return all_results

    def rank(self, results: List[Dict]) -> Dict:
        """Rank stocks by recommendation strength"""
        buys = [r for r in results if 'BUY' in r['recommendation']]
        sells = [r for r in results if 'SELL' in r['recommendation']]
        holds = [r for r in results if r['recommendation'] == 'HOLD']

        buys.sort(key=lambda x: (x['confidence'], x['rsi'] < 45), reverse=True)
        sells.sort(key=lambda x: (x['confidence'], x['rsi'] > 55), reverse=True)
        holds.sort(key=lambda x: x['rsi'])

        return {
            "strong_buys": buys[:5],
            "buys": [b for b in buys if b['recommendation'] == 'BUY'][:5],
            "strong_sells": sells[:5],
            "sells": [s for s in sells if s['recommendation'] == 'SELL'][:5],
            "neutral": holds[:10],
            "all_analyzed": len(results),
            "buy_signals": len(buys),
            "sell_signals": len(sells),
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M IST"),
        }

    def save_recommendations(self, ranked: Dict):
        """Save top BUY recommendations to DB"""
        self.conn.execute("UPDATE recommendations SET status='EXPIRED' WHERE status='OPEN'")
        for rec in ranked.get('strong_buys', []) + ranked.get('buys', []):
            self.conn.execute('''
                INSERT INTO recommendations (symbol, price, target, stop_loss, atr, rsi, trend, recommendation, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (rec['symbol'], rec['price'], rec['target_1'], rec['stop_loss'],
                  rec['atr'], rec['rsi'], rec['trend'], rec['recommendation'], rec['confidence']))
        self.conn.commit()

    def report(self, ranked: Dict):
        """Print formatted report"""
        print(f"\n{'='*60}")
        print(f"  NIVESH - NIFTY 200 SWING TRADE REPORT")
        print(f"  {ranked['generated_at']}")
        print(f"{'='*60}")

        if ranked['strong_buys']:
            print(f"\n  STRONG BUY ({len(ranked['strong_buys'])} stocks)")
            print(f"  {'-'*55}")
            for r in ranked['strong_buys']:
                print(f"  {r['symbol']:<15} ₹{r['price']:<10} RSI:{r['rsi']:<5} Conf:{r['confidence']}%")
                print(f"    Entry: ₹{r['entry_min']}-{r['entry_max']}  Target: ₹{r['target_1']}  SL: ₹{r['stop_loss']}")
                print(f"    Trend:{r['trend']}  ATR:₹{r['atr']}  Vol:×{r['volume_ratio']}")
                print()

        if ranked['buys']:
            print(f"\n  BUY ({len(ranked['buys'])} stocks)")
            print(f"  {'-'*55}")
            for r in ranked['buys']:
                print(f"  {r['symbol']:<15} ₹{r['price']:<10} RSI:{r['rsi']:<5} Conf:{r['confidence']}%")
                print(f"    Entry: ₹{r['entry_min']}-{r['entry_max']}  Target: ₹{r['target_1']}  SL: ₹{r['stop_loss']}")
                print()

        if ranked['strong_sells']:
            print(f"\n  STRONG SELL ({len(ranked['strong_sells'])} stocks)")
            print(f"  {'-'*55}")
            for r in ranked['strong_sells'][:3]:
                print(f"  {r['symbol']:<15} ₹{r['price']:<10} RSI:{r['rsi']:<5} Conf:{r['confidence']}%")

        print(f"\n  SUMMARY")
        print(f"  {'-'*55}")
        print(f"  Total analyzed:   {ranked['all_analyzed']}")
        print(f"  BUY signals:      {ranked['buy_signals']}")
        print(f"  SELL signals:     {ranked['sell_signals']}")
        print(f"  Market mood:       ", end="")
        if ranked['buy_signals'] > ranked['sell_signals'] * 2:
            print("BULLISH (buy more)")
        elif ranked['sell_signals'] > ranked['buy_signals'] * 2:
            print("BEARISH (be cautious)")
        else:
            print("NEUTRAL (wait for clarity)")
        print(f"{'='*60}\n")

    def close(self):
        self.conn.close()


def main():
    parser = argparse.ArgumentParser(description='Nivesh Nifty 200 Swing Trade Analyzer')
    parser.add_argument('--top', type=int, default=50, help='Number of top stocks to analyze (default: 50)')
    parser.add_argument('--symbols', type=str, default='', help='Comma-separated symbols (overrides --top)')
    parser.add_argument('--sector', type=str, default='', help='Filter by sector keyword')
    args = parser.parse_args()

    analyzer = NiveshAnalyzer()

    if args.symbols:
        symbols = [s.strip().upper() for s in args.symbols.split(',')]
    else:
        symbols = NIFTY_200_STOCKS

    results = analyzer.fetch_all(symbols, max_stocks=args.top)
    if not results:
        print("No data fetched. Check your internet connection.")
        analyzer.close()
        return

    ranked = analyzer.rank(results)
    analyzer.save_recommendations(ranked)
    analyzer.report(ranked)
    analyzer.close()


if __name__ == '__main__':
    main()
