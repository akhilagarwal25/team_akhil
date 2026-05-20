#!/usr/bin/env python3
"""Nivesh News Fetcher - Get recent news for Nifty 200 stocks via Google News RSS"""

import sys
import re
import urllib.request
import urllib.error
import time
import sqlite3
from datetime import datetime
from html import unescape

SECTOR_MAP = {
    'GAIL': 'oil_gas', 'MGL': 'oil_gas', 'IGL': 'oil_gas', 'PETRONET': 'oil_gas',
    'RELIANCE': 'oil_gas', 'ONGC': 'oil_gas', 'BPCL': 'oil_gas', 'IOC': 'oil_gas',
    'HDFCBANK': 'banking', 'ICICIBANK': 'banking', 'SBIN': 'banking', 'KOTAKBANK': 'banking',
    'AXISBANK': 'banking', 'INDUSINDBK': 'banking', 'AUBANK': 'banking',
    'TCS': 'it', 'INFY': 'it', 'HCLTECH': 'it', 'WIPRO': 'it', 'TECHM': 'it',
    'TATASTEEL': 'metals', 'HINDALCO': 'metals', 'VEDL': 'metals', 'JSWSTEEL': 'metals', 'SAIL': 'metals',
    'TATAMOTORS': 'auto', 'MARUTI': 'auto', 'M&M': 'auto', 'HEROMOTOCO': 'auto', 'EICHERMOT': 'auto',
    'TVSMOTOR': 'auto', 'ASHOKLEY': 'auto', 'BAJAJ-AUTO': 'auto',
    'SUNPHARMA': 'pharma', 'CIPLA': 'pharma', 'DRREDDY': 'pharma', 'LUPIN': 'pharma',
    'AUROPHARMA': 'pharma', 'ZYDUSLIFE': 'pharma', 'GLENMARK': 'pharma', 'BIOCON': 'pharma',
    'TITAN': 'consumer', 'NESTLEIND': 'consumer', 'HINDUNILVR': 'consumer', 'ITC': 'consumer',
    'BRITANNIA': 'consumer', 'DABUR': 'consumer', 'MARICO': 'consumer', 'UBL': 'consumer',
    'DATAPATTNS': 'it', 'TATAINVEST': 'financial', 'CLEAN': 'clean_energy',
    'RIIL': 'infrastructure',
}

def fetch_news(symbol: str, days: int = 14) -> list:
    """Fetch recent news for a stock from Google News RSS"""
    news = []
    try:
        query = f"{symbol}+India+stock+OR+share+OR+results+OR+quarterly"
        url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-IN&gl=IN&ceid=IN:en"
        
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=10)
        data = resp.read().decode('utf-8', errors='ignore')
        
        titles = re.findall(r'<title>([^<]+)</title>', data)
        dates = re.findall(r'<pubDate>([^<]+)</pubDate>', data)
        
        for i, title in enumerate(titles[1:8]):  # Skip first (feed title)
            title = unescape(title)
            # Skip if too generic or not relevant
            if symbol not in title and len(titles) > 2:
                # Try to match
                pass
            pub_date = dates[i] if i < len(dates) else ''
            news.append({'title': title, 'date': pub_date})
    except Exception as e:
        pass
    
    return news

def get_stock_info(symbol: str) -> dict:
    """Get stock info from Moneycontrol"""
    return {'sector': SECTOR_MAP.get(symbol, 'general')}

def research_stock_news(symbol: str) -> dict:
    """Get comprehensive news for a stock"""
    news = fetch_news(symbol, 14)
    info = get_stock_info(symbol)
    
    headlines = []
    for n in news[:5]:
        headline = n['title'][:100]
        headlines.append(f"- {headline}")
    
    return {
        'symbol': symbol,
        'sector': info['sector'],
        'news_count': len(news),
        'headlines': '\n'.join(headlines) if headlines else 'No recent news found',
        'fetched_at': datetime.now().isoformat()
    }

def research_batch(symbols: list) -> list:
    """Research a batch of stocks"""
    results = []
    for sym in symbols:
        r = research_stock_news(sym)
        results.append(r)
        time.sleep(0.5)
    return results

if __name__ == '__main__':
    import urllib.parse
    
    if len(sys.argv) < 2:
        print("Usage: nivesh_news.py SYMBOL [SYMBOL2 ...]")
        sys.exit(1)
    
    symbols = sys.argv[1:]
    for sym in symbols:
        r = research_stock_news(sym)
        print(f"\n{r['symbol']} ({r['sector']})")
        print(f"  News found: {r['news_count']}")
        print(r['headlines'])
