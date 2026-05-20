#!/usr/bin/env python3
"""Nivesh Full Nifty 200 Fetcher - Angel One + yfinance hybrid"""

import sys
sys.path.insert(0, '/opt/data/nivesh/lib/python3.13/site-packages')

from SmartApi import SmartConnect
from pyotp import TOTP
import yfinance as yf
import pandas as pd
import pandas_ta as ta
import sqlite3
import time
from datetime import datetime, timedelta

API_KEY = "Nh2bhJgg"
CLIENT_ID = "AGRA1690"
PIN = "2501"
TOTP_SECRET = "Q3LD3GTSXK4AVFBF7QC6JL2FR4"

# Known good Angel One tokens (verified working)
ANGEL_TOKENS = {
    'RELIANCE': '2885', 'TCS': '11536', 'HDFCBANK': '1333', 'INFY': '1594',
    'ICICIBANK': '4963', 'SBIN': '3045', 'TATAMOTORS': '3456', 'ITC': '1660',
    'KOTAKBANK': '1922', 'HINDUNILVR': '1394', 'LT': '11483', 'SUNPHARMA': '3351',
    'BHARTIARTL': '10604', 'TITAN': '8976', 'BAJFINANCE': '16674', 'MARUTI': '10999',
    'M&M': '10819', 'NESTLEIND': '18983', 'ADANIPORTS': '15083', 'CIPLA': '3121',
    'AXISBANK': '1730', 'ASIANPAINT': '381', 'HCLTECH': '7229', 'WIPRO': '1267',
    'ULTRACEMCO': '17020', 'TATACONSUM': '10373', 'DRREDDY': '2810', 'BRITANNIA': '8071',
    'POWERGRID': '14977', 'DABUR': '3281', 'TATASTEEL': '2963', 'BAJAJFINSV': '16675',
    'ADANIENT': '3210', 'NTPC': '11630', 'INDUSINDBK': '5258', 'GRASIM': '3002',
    'HEROMOTOCO': '5485', 'LUPIN': '24982', 'SHREECEM': '18039', 'TECHM': '5403',
    'BAJAJ-AUTO': '10754', 'EICHERMOT': '3155', 'ONGC': '2472', 'ZYDUSLIFE': '10942',
    'IOC': '16221', 'JSWSTEEL': '11723', 'COALINDIA': '20374', 'HINDALCO': '4389',
    'VEDL': '2968', 'BPCL': '2929',
}

# Nifty 200 stocks - yfinance format -> Angel One token (where known)
# yfinance uses .NS suffix for NSE
YFINANCE_NIFTY200 = [
    # Nifty 50
    "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "TATAMOTORS", "ITC",
    "KOTAKBANK", "HINDUNILVR", "LT", "SUNPHARMA", "BHARTIARTL", "TITAN", "BAJFINANCE",
    "MARUTI", "M&M", "NESTLEIND", "ADANIPORTS", "CIPLA",
    # Nifty 100 additions
    "AXISBANK", "ASIANPAINT", "HCLTECH", "WIPRO", "ULTRACEMCO", "TATACONSUM", "DRREDDY",
    "BRITANNIA", "POWERGRID", "DABUR", "TATASTEEL", "BAJAJFINSV", "ADANIENT", "NTPC",
    "INDUSINDBK", "GRASIM", "HEROMOTOCO", "LUPIN", "SHREECEM", "TECHM", "BAJAJ-AUTO",
    "EICHERMOT", "ONGC", "ZYDUSLIFE", "IOC", "JSWSTEEL", "COALINDIA", "HINDALCO",
    "VEDL", "BPCL",
    # Nifty 200 specific
    "AUROPHARMA", "PNB", "CANBK", "BANDHANBNK", "AUBANK", "FEDERALBNK",
    "IOB", "UNIONBANK", "BANKBARODA", "AMBUJACEM", "ACC", "BIOCON",
    "GLENMARK", "TORNTOPHARM", "ALKEM", "ABB", "SIEMENS", "HAVELLS",
    "CROMPTON", "BOSCHLTD", "BHARATFORG", "APOLLOTYRE", "BALKRISIND", "MRF",
    "IRCTC", "CONCOR", "DABUR", "GODREJCP", "COLPAL", "MARICO", "UBL",
    "PAGEIND", "RAYMOND", "TRIDENT", "AARTIDRUGS", "CIPLA", "GLENMARK",
    "ALKYLAMINE", "AURUM", "METROBRAND", "FINEORG", "NATCOPHARM", "MANKIND",
    "TATAELXSI", "KPIT", "LTIM", "COFORGE", "PERSISTENT", "DATAPATTNS",
    "RAJRATAN", "POLYCAB", "KEI", "HAVELLS", "SCHAND", "GAIL", "MGL",
    "IGL", "GUJGASLTD", "ADANIGAS", "PETRONET", "OIL", "NFL",
    "COALINDIA", "NMDC", "NATIONALUM", "HINDCOPPER", "HINDZINC", "VEDL",
    "NCLIND", "BIRLACORPN", "AMRUTANJAN", "FIEMIND", "GUFICBIO",
    "BASF", "SUMICHEM", "TATASTLBSL", "WSTCSTPAPR", "STARCEMENT", "RAMCOCEM",
    "INDIACEM", "JKLAKSHMI", "JKCEMENT", "HEIDELBERG", "TREJHARA",
    "SAFARI", "VIPIND", "MANYAVAR", "SPANDANA", "CSBBANK", "DCBBANK",
    "RBLBANK", "IDIB", "UJJIVAN", "EQUITAS", "AWAAN", "RIIL",
    "KALYANKJIL", "NIIT", "CLEAN", "VAIBHAVGBL", "KSL", "PRAKRISHNA",
    "GANGESSEC", "JPASSOCIAT", "RNAM", "MASFIN", "SBFC", "UTIAMC",
    "CDSL", "CAMS", "NETWORK18", "PVR", "INOXLEISUR", "HATHWAY",
    "DBCORP", "SUNTV", "NAVNETRD", "RADIOCITY", "ENIL",
    "AFFLE", "BECTORFOOD", "BRIGADE", "CENTURYTEX", "DLF", "GODREJPROP",
    "LICHSGFIN", "L&TFH", "MFSL", "MUTHOOTFIN", "BAJJAUTOFIN", "CHOLAFIN",
    "SHRIRAMFIN", "LICHFL", "SPANDANA", "AADHAR", "AARTIP", "AARTI",
    "ADANIPOWER", "ADANITRANS", "ADANIENT", "ADANIGREEN", "ADANIPORTS",
    "TATAPOWER", "TATASTEEL", "TATAMOTORS", "TATACHEM", "TATACOMM",
    "TATACONSUM", "TITAN", "TATAELXSI", "TATAINVEST", "TATAMETALI",
    "TATASTLBSL", "TATACOFFEE", "TATASTL", "TITAN", "TRENT", "TATA",
    "INFY", "WIPRO", "HCLTECH", "TECHM", "INFRATEL", "ROUTE",
    "INTELLECT", "NIACL", "ICICIPRULI", "SBILIFE", "HDFCLIFE", "HDFCAMC",
    "HDFCBANK", "ICICIBANK", "AXISBANK", "KOTAKBANK", "INDUSINDBK", "IDFCFIRSTB",
    "BANDHANBNK", "AUBANK", "FEDERALBNK", "CANBK", "PNB", "UNIONBANK", "IOB",
    "BANKBARODA", "SBIN", "IOB", "BANKINDIA", "CENTRALBANK",
    "RELIANCE", "ONGC", "BPCL", "IOC", "HINDPETRO", "GAIL", "MGL", "IGL",
    "PETRONET", "OIL", "NMDC", "COALINDIA", "TATASTEEL", "HINDALCO", "VEDL",
    "JSWSTEEL", "SAIL", "NATIONALUM", "HINDCOPPER", "HINDZINC",
    "NTPC", "POWERGRID", "TATAPOWER", "ADANIGREEN", "ADANIPOWER", "JSWENERGY",
    "GREENPEACE", "INOXWIND", "SUZLON", "VESTAS", "KPIT",
    "IRCTC", "CONCOR", "ADANIPORTS", "MAHINDCIE", "ESCORTS",
    "BHARATFORG", "ENDURANCE", "MOTHERSN", "AMARAJA", "EXIDEIND",
    "AMARAJABAT", "CEAT", "APOLLOTYRE", "BALKRISIND", "MRF", "TVSHOLDINGS",
    "BAJAJ-AUTO", "M&M", "HEROMOTOCO", "EICHERMOT", "MARUTI", "TATAMOTORS",
    "ASHOKLEY", "TVSMOTOR", "SMLISUZU", "BAJAJAUTO",
    "HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "TATACONSUM", "DABUR",
    "GODREJCP", "COLPAL", "MARICO", "UBL", "JUBLFOOD", "DEVYANI",
    "WESTLIFE", "SAFARI", "PAGEIND", "RAYMOND", "TRIDENT", "WHIRLPOOL",
    "VOLTAS", "CROMPTON", "HAVELLS", "ORIENTELEC", "KEI", "POLYCAB",
    "SYSKA", "CAMS", "NIIT", "COFORGE", "LTIM", "PERSISTENT", "TATAELXSI",
    "INTELLECT", "BSE", "CDSL", "NETWORK18", "ZOMATO", "NESTLEIND",
]

# Deduplicate while preserving order
seen = set()
YFINANCE_NIFTY200 = [x for x in YFINANCE_NIFTY200 if not (x in seen or seen.add(x))]

print(f"Total unique symbols to fetch: {len(YFINANCE_NIFTY200)}")


def connect_angel():
    smart = SmartConnect(api_key=API_KEY)
    totp = TOTP(TOTP_SECRET).now()
    data = smart.generateSession(clientCode=CLIENT_ID, password=PIN, totp=totp)
    if data.get('status'):
        return smart
    print(f"Angel One auth failed: {data}")
    return None


def get_angel_ltp(smart, symbol):
    """Try Angel One LTP for known symbols"""
    token = ANGEL_TOKENS.get(symbol)
    if not token:
        return None
    try:
        data = smart.ltpData('NSE', symbol, token)
        if not data.get('status'):
            return {'error': data.get('message', 'API error')}
        d = data['data']
        return {
            'price': d.get('ltp'),
            'high': d.get('high'),
            'low': d.get('low'),
            'open': d.get('open'),
            'close': d.get('close'),
            'volume': d.get('volume', 0),
            'change': d.get('change'),
            'change_pct': d.get('pChange'),
            'source': 'angel',
        }
    except Exception as e:
        return {'error': str(e), 'source': 'angel'}


def get_yfinance_data(symbol):
    """Fetch from yfinance (free, works everywhere)"""
    try:
        # Try NSE first, then BSE, then without suffix
        for suffix in ['.NS', '.BO', '']:
            try:
                sym_key = f"{symbol}{suffix}" if suffix else symbol
                ticker = yf.Ticker(sym_key)
                hist = ticker.history(period="3mo")
                if not hist.empty:
                    break
            except:
                continue
        else:
            return None
        
        hist = hist.dropna()
        if hist.empty:
            return None
        
        latest = hist.iloc[-1]
        prev = hist.iloc[-2] if len(hist) > 1 else latest
        
        price = float(latest['Close'])
        prev_close = float(prev['Close'])
        change = price - prev_close
        change_pct = (change / prev_close * 100) if prev_close else 0
        
        return {
            'price': price,
            'high': float(latest['High']),
            'low': float(latest['Low']),
            'open': float(latest['Open']),
            'close': float(latest['Close']),
            'volume': int(latest['Volume']),
            'change': change,
            'change_pct': change_pct,
            'source': 'yfinance',
        }
    except Exception as e:
        return None


def get_yfinance_candles(symbol, days=90):
    """Get daily candles from yfinance"""
    try:
        for suffix in ['.NS', '.BO', '']:
            try:
                sym_key = f"{symbol}{suffix}" if suffix else symbol
                ticker = yf.Ticker(sym_key)
                hist = ticker.history(period="3mo")
                if not hist.empty and len(hist) >= 20:
                    break
            except:
                continue
        else:
            return []
        
        hist = hist.dropna()
        if hist.empty or len(hist) < 20:
            return []
        return [{
            'symbol': symbol,
            'timestamp': str(d.date()),
            'open': float(r['Open']),
            'high': float(r['High']),
            'low': float(r['Low']),
            'close': float(r['Close']),
            'volume': int(r['Volume']),
        } for d, r in hist.iterrows()]
    except:
        return []


def analyze_stock(symbol, candles, ltp_data):
    """Run technical analysis on candle data"""
    if len(candles) < 20:
        return None
    
    df = pd.DataFrame(candles)
    # yfinance returns capitalized columns; normalize to lowercase
    df.columns = [c.lower() if c in ['Open','High','Low','Close','Volume'] else c for c in df.columns]
    close = df['close']
    high = df['high']
    low = df['low']
    vol = df['volume']
    
    df['sma20'] = ta.sma(close, length=20)
    df['sma50'] = ta.sma(close, length=50)
    df['sma200'] = ta.sma(close, length=200)
    df['rsi'] = ta.rsi(close, length=14)
    df['atr'] = ta.atr(high, low, close, length=14)
    macd = ta.macd(close)
    bb = ta.bbands(close, length=20)
    adx = ta.adx(high, low, close, length=14)
    volume_sma = ta.sma(vol, length=20)
    
    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest
    
    price = float(latest['close'])
    rsi = float(latest['rsi']) if pd.notna(latest['rsi']) else 50
    sma20 = float(latest['sma20']) if pd.notna(latest['sma20']) else price
    sma50 = float(latest['sma50']) if pd.notna(latest['sma50']) else price
    atr = float(latest['atr']) if pd.notna(latest['atr']) else (price * 0.02)
    
    macd_val = float(macd['MACD_12_26_9'].iloc[-1]) if macd is not None and not macd.empty and 'MACD_12_26_9' in macd.columns else 0
    macd_hist = float(macd['MACDh_12_26_9'].iloc[-1]) if macd is not None and not macd.empty and 'MACDh_12_26_9' in macd.columns else 0
    macd_signal = float(macd['MACDs_12_26_9'].iloc[-1]) if macd is not None and not macd.empty and 'MACDs_12_26_9' in macd.columns else 0
    
    bb_cols = [c for c in bb.columns if c.startswith('BBU_')] if bb is not None and not bb.empty else []
    bb_low_cols = [c for c in bb.columns if c.startswith('BBL_')] if bb is not None and not bb.empty else []
    bb_upper = float(bb[bb_cols[0]].iloc[-1]) if bb_cols else price * 1.05
    bb_lower = float(bb[bb_low_cols[0]].iloc[-1]) if bb_low_cols else price * 0.95
    bb_width = (bb_upper - bb_lower) / price if price else 0
    
    adx_val = float(adx['ADX_14'].iloc[-1]) if adx is not None and not adx.empty and 'ADX_14' in adx.columns else 25
    dmp = float(adx['DMP_14'].iloc[-1]) if adx is not None and not adx.empty and 'DMP_14' in adx.columns else 25
    dmn = float(adx['DMN_14'].iloc[-1]) if adx is not None and not adx.empty and 'DMN_14' in adx.columns else 25
    
    # Volume SMA
    vol_sma_series = ta.sma(vol, length=20)
    vol_ratio = float(latest['volume']) / float(vol_sma_series.iloc[-1]) if vol_sma_series is not None and vol_sma_series.iloc[-1] else 1
    
    # Trend
    if price > sma50:
        trend = "BULLISH"
    elif price < sma50:
        trend = "BEARISH"
    else:
        trend = "NEUTRAL"
    
    # Volatility
    
    # Volume trend
    vol_trend = "HIGH" if vol_ratio > 1.3 else "NORMAL" if vol_ratio > 0.7 else "LOW"
    
    # Support/Resistance
    support = price - atr * 1.5
    resistance = price + atr * 1.5
    target = price + atr * 3
    stop_loss = price - atr * 1.5
    
    # Recommendation
    rec, conf, rationale = "HOLD", 50, ""
    
    if rsi < 35 and macd_hist > 0 and trend == "BULLISH":
        rec, conf = "STRONG_BUY", 85
        rationale = f"RSI {rsi:.0f} oversold + MACD bullish + above SMA50"
    elif rsi < 40 and price > sma20:
        rec, conf = "BUY", 70
        rationale = f"RSI {rsi:.0f} oversold + price above SMA20"
    elif rsi < 45 and trend == "BULLISH":
        rec, conf = "BUY", 65
        rationale = f"RSI {rsi:.0f} oversold + bullish trend"
    elif rsi > 70 and macd_hist < 0:
        rec, conf = "STRONG_SELL", 80
        rationale = f"RSI {rsi:.0f} overbought + MACD bearish"
    elif rsi > 65 and trend == "BEARISH":
        rec, conf = "SELL", 70
        rationale = f"RSI {rsi:.0f} overbought + bearish trend"
    elif rsi > 60:
        rec, conf = "SELL", 60
        rationale = f"RSI {rsi:.0f} overbought"
    else:
        rationale = f"RSI {rsi:.0f}, Trend {trend}"
    
    return {
        'symbol': symbol,
        'price': round(price, 2),
        'change_pct': round((ltp_data.get('change_pct') or 0), 2) if ltp_data else 0,
        'rsi': round(rsi, 1),
        'sma20': round(sma20, 2),
        'sma50': round(sma50, 2),
        'atr': round(atr, 2),
        'macd': round(macd_val, 2),
        'macd_hist': round(macd_hist, 2),
        'adx': round(adx_val, 1),
        'bb_width': round(bb_width, 3),
        'vol_ratio': round(vol_ratio, 2),
        'trend': trend,
        'vol_trend': vol_trend,
        'support': round(support, 2),
        'resistance': round(resistance, 2),
        'target': round(target, 2),
        'stop_loss': round(stop_loss, 2),
        'rec': rec,
        'conf': conf,
        'rationale': rationale,
        'candles_count': len(candles),
        'source': ltp_data.get('source', 'yfinance') if ltp_data else 'yfinance',
    }


def main():
    # Ensure DB tables exist
    db = sqlite3.connect('/opt/data/jaribloom/nivesh.db')
    db.execute('''CREATE TABLE IF NOT EXISTS prices (
        symbol TEXT, timestamp TEXT, price REAL, high REAL, low REAL,
        open REAL, close REAL, volume INTEGER, change_pct REAL, source TEXT
    )''')
    db.execute('''CREATE TABLE IF NOT EXISTS candles (
        symbol TEXT, timestamp TEXT, open REAL, high REAL, low REAL,
        close REAL, volume INTEGER
    )''')
    db.execute('''CREATE TABLE IF NOT EXISTS analysis (
        symbol TEXT PRIMARY KEY, timestamp TEXT, price REAL, rsi REAL, sma20 REAL,
        sma50 REAL, atr REAL, macd REAL, macd_hist REAL, adx REAL,
        trend TEXT, support REAL, resistance REAL, target REAL,
        stop_loss REAL, rec TEXT, conf INTEGER, rationale TEXT, change_pct REAL
    )''')
    db.execute('''CREATE TABLE IF NOT EXISTS recommendations (
        symbol TEXT PRIMARY KEY, timestamp TEXT, price REAL, target REAL,
        stop_loss REAL, atr REAL, rsi REAL, trend TEXT,
        recommendation TEXT, confidence INTEGER, status TEXT
    )''')
    db.commit()
    
    # Connect Angel One
    angel = connect_angel()
    
    all_results = []
    
    # Fetch in batches - try Angel One first, fallback to yfinance
    for i, sym in enumerate(YFINANCE_NIFTY200, 1):
        # Try Angel One first for LTP
        ltp_data = None
        if angel:
            ltp_data = get_angel_ltp(angel, sym)
        
        # Get candles from yfinance (always works)
        candles = get_yfinance_candles(sym, 90)
        
        if len(candles) < 20:
            print(f"[{i}/{len(YFINANCE_NIFTY200)}] {sym}: insufficient data ({len(candles)} candles)")
            continue
        
        # Analyze
        result = analyze_stock(sym, candles, ltp_data)
        if not result or result.get('rsi') is None:
            print(f"[{i}/{len(YFINANCE_NIFTY200)}] {sym}: analysis failed (RSI=None)")
            continue
        
        # Save to DB
        if ltp_data and 'error' not in ltp_data and ltp_data.get('price'):
            db.execute('''INSERT OR REPLACE INTO prices 
                (symbol, timestamp, price, high, low, open_price, close_price, volume, change_pct, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (sym, datetime.now().isoformat(), ltp_data['price'], ltp_data['high'],
                 ltp_data['low'], ltp_data['open'], ltp_data['close'],
                 ltp_data['volume'], ltp_data.get('change_pct') or 0, 'angel'))
        
        for c in candles:
            db.execute('''INSERT OR REPLACE INTO candles 
                (symbol, timestamp, open_price, high, low, close_price, volume)
                VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (c['symbol'], c['timestamp'], c['open'], c['high'], c['low'], c['close'], c['volume']))
        
        db.execute('''INSERT OR REPLACE INTO analysis 
            (symbol, timestamp, price, rsi, sma20, sma50, atr, macd, macd_hist, adx,
             trend, support, resistance, target, stop_loss, rec, conf, rationale, change_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (sym, datetime.now().isoformat(), result['price'], result['rsi'], result['sma20'],
             result['sma50'], result['atr'], result['macd'], result['macd_hist'], result['adx'],
             result['trend'], result['support'], result['resistance'], result['target'],
             result['stop_loss'], result['rec'], result['conf'], result['rationale'], result['change_pct']))
        
        all_results.append(result)
        
        _src = ltp_data.get('source') if ltp_data and isinstance(ltp_data, dict) else 'yfinance'
        _chg_raw = ltp_data.get('change_pct') if ltp_data and isinstance(ltp_data, dict) else None
        if _chg_raw is None:
            _chg_raw = result.get('change_pct') if result else None
        _chg = float(_chg_raw) if _chg_raw is not None else 0.0
        _rsi = float(result.get('rsi') or 50)
        _price = float(result.get('price') or 0)
        _rec = str(result.get('rec') or 'HOLD')
        _conf = int(result.get('conf') or 0)
        print(f"[{i}/{len(YFINANCE_NIFTY200)}] {sym}: Rs{_price:.2f} ({_chg:+.2f}%) | RSI:{_rsi:.1f} | {_rec} ({_conf}%) | {_src}")
        
        # Rate limit
        time.sleep(0.1)
    
    db.commit()
    db.close()
    
    if angel:
        angel.terminateSession(CLIENT_ID)
    
    print(f"\n{'='*90}")
    print(f"  ANALYSIS COMPLETE: {len(all_results)}/{len(YFINANCE_NIFTY200)} stocks")
    print(f"{'='*90}")
    
    # Sort and display recommendations
    buys = sorted([r for r in all_results if 'BUY' in r['rec']], key=lambda x: x['rsi'])
    sells = sorted([r for r in all_results if 'SELL' in r['rec']], key=lambda x: -x['rsi'])
    holds = sorted([r for r in all_results if r['rec'] == 'HOLD'], key=lambda x: x['rsi'])
    
    print(f"\n  STRONG BUY ({len(buys)} stocks):")
    for r in buys[:10]:
        print(f"    {r['symbol']:<15} ₹{r['price']:>10}  RSI:{r['rsi']:>5}  Tgt:₹{r['target']:>8}  SL:₹{r['stop_loss']:>8}  Conf:{r['conf']}%  {r['trend']}")
    
    print(f"\n  SELL ({len(sells)} stocks):")
    for r in sells[:10]:
        print(f"    {r['symbol']:<15} ₹{r['price']:>10}  RSI:{r['rsi']:>5}  Conf:{r['conf']}%  {r['trend']}")
    
    print(f"\n  HOLD ({len(holds)} stocks):")
    print(f"    Top oversold:", ', '.join(f"{r['symbol']}({r['rsi']})" for r in holds[:10]))
    
    # Market summary
    rec_counts = {}
    for r in all_results:
        rec_counts[r['rec']] = rec_counts.get(r['rec'], 0) + 1
    
    avg_rsi = sum(r['rsi'] for r in all_results) / len(all_results)
    
    print(f"\n  MARKET SUMMARY:")
    for rec, cnt in sorted(rec_counts.items()):
        print(f"    {rec}: {cnt}")
    print(f"    Avg RSI: {avg_rsi:.1f}")
    
    print(f"{'='*90}")


if __name__ == '__main__':
    main()
