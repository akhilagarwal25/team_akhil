#!/usr/bin/env python3
"""Nivesh Angel One Data Fetcher - fetch live Nifty 200 data via SmartAPI"""

import sys
sys.path.insert(0, '/opt/data/nivesh/lib/python3.13/site-packages')

from SmartApi import SmartConnect
from pyotp import TOTP
import json
import sqlite3
import time
from datetime import datetime

API_KEY = "Nh2bhJgg"
CLIENT_ID = "AGRA1690"
PIN = "2501"
TOTP_SECRET = "Q3LD3GTSXK4AVFBF7QC6JL2FR4"

# Full Nifty 200 stock list with Angel One tokens
STOCKS = {
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
    'VEDL': '2968', 'BPCL': '2929', 'ATUL': '2876',
}


def connect():
    smart = SmartConnect(api_key=API_KEY)
    totp = TOTP(TOTP_SECRET).now()
    data = smart.generateSession(clientCode=CLIENT_ID, password=PIN, totp=totp)
    if not data.get('status'):
        print(f"Auth failed: {data}")
        return None
    return smart


def get_ltp(smart, symbol, token):
    try:
        data = smart.ltpData('NSE', symbol, token)
        if data.get('status'):
            d = data['data']
            return {
                'symbol': symbol,
                'price': d.get('ltp'),
                'high': d.get('high'),
                'low': d.get('low'),
                'open': d.get('open'),
                'close': d.get('close'),
                'volume': d.get('volume', 0),
                'change': d.get('change'),
                'change_pct': d.get('pChange'),
            }
    except Exception as e:
        return {'symbol': symbol, 'error': str(e)}
    return {'symbol': symbol, 'error': 'no data'}


def get_candles(smart, symbol, token, days=90):
    try:
        from datetime import timedelta
        to_date = datetime.now()
        from_date = to_date - timedelta(days=days)
        params = {
            "exchange": "NSE",
            "symboltoken": token,
            "interval": "ONE_DAY",
            "fromdate": from_date.strftime("%Y-%m-%d %H:%M"),
            "todate": to_date.strftime("%Y-%m-%d %H:%M")
        }
        data = smart.getCandleData(params)
        if data.get('status') and data['data']:
            return [{
                'symbol': symbol,
                'timestamp': c[0],
                'open': c[1], 'high': c[2], 'low': c[3],
                'close': c[4], 'volume': c[5]
            } for c in data['data']]
    except Exception as e:
        pass
    return []


def main():
    print("Connecting to Angel One...")
    smart = connect()
    if not smart:
        return

    print(f"Fetching LTP for {len(STOCKS)} stocks...")
    prices = {}
    for i, (sym, tok) in enumerate(STOCKS.items(), 1):
        r = get_ltp(smart, sym, tok)
        prices[sym] = r
        chg = r.get('change_pct') or 0
        if 'error' not in r:
            print(f"  [{i}/{len(STOCKS)}] {sym}: ₹{r['price']} ({chg:+.2f}%)")
        else:
            print(f"  [{i}/{len(STOCKS)}] {sym}: ERROR - {r.get('error')}")
        time.sleep(0.15)  # Rate limit

    # Save to DB
    db = sqlite3.connect('/opt/data/jaribloom/nivesh.db')
    for sym, r in prices.items():
        if 'error' in r:
            continue
        db.execute('''
            INSERT OR REPLACE INTO prices (symbol, timestamp, price, high, low, open, volume, change_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (sym, datetime.now().isoformat(), r['price'], r['high'],
              r['low'], r['open'], r['volume'], r.get('change_pct', 0)))

    print(f"\nFetching candles for top 20 stocks...")
    for i, sym in enumerate(list(STOCKS.keys())[:20], 1):
        tok = STOCKS[sym]
        candles = get_candles(smart, sym, tok, 90)
        for c in candles:
            db.execute('''
                INSERT OR REPLACE INTO candles (symbol, timestamp, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (c['symbol'], c['timestamp'], c['open'], c['high'], c['low'], c['close'], c['volume']))
        print(f"  [{i}/20] {sym}: {len(candles)} candles saved")
        time.sleep(0.2)

    db.commit()
    db.close()
    smart.terminateSession(CLIENT_ID)
    print("\nDone! Data saved to nivesh.db")

    # Summary
    success = sum(1 for r in prices.values() if 'error' not in r)
    print(f"\nSummary: {success}/{len(STOCKS)} stocks fetched")
    print("\nTop movers today:")
    valid = [(s, r) for s, r in prices.items() if 'error' not in r]
    valid.sort(key=lambda x: x[1].get('change_pct') or 0, reverse=True)
    for sym, r in valid[:5]:
        chg = r.get('change_pct') or 0
        print(f"  {sym}: ₹{r['price']} ({chg:+.2f}%)")
    print("\nBottom movers:")
    for sym, r in valid[-5:]:
        chg = r.get('change_pct') or 0
        print(f"  {sym}: ₹{r['price']} ({chg:+.2f}%)")


if __name__ == '__main__':
    main()
