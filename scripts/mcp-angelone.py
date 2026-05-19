#!/usr/bin/env python3
"""
Angel One MCP Server - Nivesh Stock Analyst Data Provider
Provides stock market data via MCP protocol

Usage:
  python mcp-angelone.py
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Any

# Add venv to path
sys.path.insert(0, '.venv/lib/python3.12/site-packages')

from SmartApi import SmartConnect
from pyotp import TOTP

# Configuration
API_KEY = os.getenv('SMARTAPI_API_KEY', 'Nh2bhJgg')
CLIENT_ID = os.getenv('SMARTAPI_USERNAME', 'AGRA1690')
PIN = os.getenv('SMARTAPI_PIN', '2501')
TOTP_SECRET = os.getenv('SMARTAPI_TOTP_SECRET', 'Q3LD3GTSXK4AVFBF7QC6JL2FR4')

# Symbol Token Mapping (NSE)
SYMBOL_TOKENS = {
    'RELIANCE': '2885',
    'TATAMOTORS': '3456',
    'TCS': '11536',
    'INFOSYS': '1594',
    'HDFCBANK': '1333',
    'ICICIBANK': '4963',
    'SBIN': '3045',
    'BHARTIARTL': '10604',
    'ITC': '1660',
    'KOTAKBANK': '1922',
    'LT': '11483',
    'SUNPHARMA': '3351',
    'ADANIPORTS': '15083',
    'ASIANPAINT': '381',
    'NESTLEIND': '18983',
    'TITAN': '8976',
    'BAJFINANCE': '16674',
    'MARUTI': '10999',
    'HINDUNILVR': '1394',
    'CIPLA': '3121',
}

# Stock Names (for search)
STOCK_NAMES = {
    'RELIANCE': 'Reliance Industries',
    'TATAMOTORS': 'Tata Motors',
    'TCS': 'Tata Consultancy Services',
    'INFOSYS': 'Infosys',
    'HDFCBANK': 'HDFC Bank',
    'ICICIBANK': 'ICICI Bank',
    'SBIN': 'State Bank of India',
    'BHARTIARTL': 'Bharti Airtel',
    'ITC': 'ITC Limited',
    'KOTAKBANK': 'Kotak Mahindra Bank',
    'LT': 'Larsen & Toubro',
    'SUNPHARMA': 'Sun Pharmaceutical',
    'ADANIPORTS': 'Adani Ports',
    'ASIANPAINT': 'Asian Paints',
    'NESTLEIND': 'Nestle India',
    'TITAN': 'Titan Company',
    'BAJFINANCE': 'Bajaj Finance',
    'MARUTI': 'Maruti Suzuki',
    'HINDUNILVR': 'Hindustan Unilever',
    'CIPLA': 'Cipla',
}


class AngelOneMCP:
    def __init__(self):
        self.smart = SmartConnect(api_key=API_KEY)
        self.session = None
        self.token = None

    def generate_session(self):
        """Generate TOTP and create session"""
        totp = TOTP(TOTP_SECRET).now()
        data = self.smart.generateSession(
            clientCode=CLIENT_ID,
            password=PIN,
            totp=totp
        )
        if data.get('status'):
            self.token = data['data']['jwtToken']
            self.session = data['data']
            return True
        return False

    def close_session(self):
        """Close session"""
        try:
            self.smart.terminateSession(CLIENT_ID)
        except:
            pass
        self.token = None
        self.session = None

    def get_ltp(self, symbol: str) -> dict:
        """Get Last Traded Price"""
        token = SYMBOL_TOKENS.get(symbol.upper())
        if not token:
            return {'error': f'Symbol {symbol} not found'}

        try:
            data = self.smart.ltpData('NSE', symbol.upper(), token)
            if data.get('status'):
                ltp = data['data']
                return {
                    'symbol': symbol.upper(),
                    'name': STOCK_NAMES.get(symbol.upper(), symbol),
                    'price': ltp.get('ltp'),
                    'high': ltp.get('high'),
                    'low': ltp.get('low'),
                    'open': ltp.get('open'),
                    'close': ltp.get('close'),
                    'volume': ltp.get('volume', 0),
                    'change': ltp.get('change'),
                    'changePercent': ltp.get('pChange'),
                    'exchange': 'NSE'
                }
            return {'error': data.get('message', 'Failed to get LTP')}
        except Exception as e:
            return {'error': str(e)}

    def get_candles(self, symbol: str, days: int = 30) -> dict:
        """Get historical candle data"""
        token = SYMBOL_TOKENS.get(symbol.upper())
        if not token:
            return {'error': f'Symbol {symbol} not found'}

        try:
            to_date = datetime.now()
            from_date = to_date - timedelta(days=days)

            params = {
                "exchange": "NSE",
                "symboltoken": token,
                "interval": "ONE_DAY",
                "fromdate": from_date.strftime("%Y-%m-%d %H:%M"),
                "todate": to_date.strftime("%Y-%m-%d %H:%M")
            }

            data = self.smart.getCandleData(params)
            if data.get('status') and data['data']:
                candles = []
                for c in data['data']:
                    candles.append({
                        'timestamp': c[0],
                        'open': c[1],
                        'high': c[2],
                        'low': c[3],
                        'close': c[4],
                        'volume': c[5]
                    })
                return {
                    'symbol': symbol.upper(),
                    'candles': candles,
                    'count': len(candles)
                }
            return {'error': data.get('message', 'No candle data')}
        except Exception as e:
            return {'error': str(e)}

    def get_portfolio(self) -> dict:
        """Get holdings"""
        try:
            data = self.smart.portfolio()
            if data.get('status'):
                return data['data']
            return {'error': data.get('message')}
        except Exception as e:
            return {'error': str(e)}

    def get_positions(self) -> dict:
        """Get open positions"""
        try:
            data = self.smart.position()
            if data.get('status'):
                return data['data'] or []
            return {'error': data.get('message')}
        except Exception as e:
            return {'error': str(e)}

    def search_symbols(self, query: str) -> list:
        """Search for symbols"""
        results = []
        query = query.upper()
        for symbol, token in SYMBOL_TOKENS.items():
            if query in symbol or query in STOCK_NAMES.get(symbol, '').upper():
                results.append({
                    'symbol': symbol,
                    'name': STOCK_NAMES.get(symbol, symbol),
                    'token': token,
                    'exchange': 'NSE'
                })
        return results

    def list_stocks(self) -> list:
        """List all available stocks"""
        return [
            {'symbol': symbol, 'name': STOCK_NAMES.get(symbol, symbol), 'token': token}
            for symbol, token in SYMBOL_TOKENS.items()
        ]


# MCP Server Implementation
class MCPServer:
    def __init__(self):
        self.angel = AngelOneMCP()
        self.tools = {
            'get_ltp': {
                'description': 'Get Last Traded Price for a stock',
                'params': {
                    'symbol': 'Stock symbol (e.g., RELIANCE, TCS)'
                }
            },
            'get_candles': {
                'description': 'Get historical candle data for technical analysis',
                'params': {
                    'symbol': 'Stock symbol',
                    'days': 'Number of days (default 30)'
                }
            },
            'search_symbols': {
                'description': 'Search for stock symbols',
                'params': {
                    'query': 'Search query'
                }
            },
            'list_stocks': {
                'description': 'List all available stocks',
                'params': {}
            },
            'get_portfolio': {
                'description': 'Get your holdings',
                'params': {}
            },
            'get_positions': {
                'description': 'Get open positions',
                'params': {}
            }
        }

    def handle_request(self, method: str, params: dict) -> dict:
        """Handle MCP request"""
        # Ensure session
        if not self.angel.token:
            if not self.angel.generate_session():
                return {'error': 'Failed to connect to Angel One'}

        # Route request
        if method == 'get_ltp':
            result = self.angel.get_ltp(params.get('symbol', 'RELIANCE'))
        elif method == 'get_candles':
            result = self.angel.get_candles(
                params.get('symbol', 'RELIANCE'),
                params.get('days', 30)
            )
        elif method == 'search_symbols':
            result = self.angel.search_symbols(params.get('query', ''))
        elif method == 'list_stocks':
            result = self.angel.list_stocks()
        elif method == 'get_portfolio':
            result = self.angel.get_portfolio()
        elif method == 'get_positions':
            result = self.angel.get_positions()
        else:
            result = {'error': f'Unknown method: {method}'}

        return result

    def run(self):
        """Run MCP server (stdio mode)"""
        print("🤖 Angel One MCP Server started", file=sys.stderr)
        print(f"📊 Available stocks: {len(SYMBOL_TOKENS)}", file=sys.stderr)

        while True:
            try:
                line = input()
                if not line.strip():
                    continue

                request = json.loads(line)
                method = request.get('method', '')
                params = request.get('params', {})
                id = request.get('id')

                result = self.handle_request(method, params)

                response = {
                    'jsonrpc': '2.0',
                    'id': id,
                    'result': result
                }
                print(json.dumps(response))
                sys.stdout.flush()

            except json.JSONDecodeError:
                pass
            except EOFError:
                break
            except Exception as e:
                print(json.dumps({
                    'jsonrpc': '2.0',
                    'id': None,
                    'error': {'code': -32603, 'message': str(e)}
                }))
                sys.stdout.flush()


if __name__ == '__main__':
    server = MCPServer()
    server.run()
