#!/usr/bin/env python3
"""
Nivesh Trading Module
Swing Trade Recommendations
"""

import sys
sys.path.insert(0, '.venv/lib/python3.12/site-packages')

import pandas as pd
import pandas_ta as ta
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional

class SwingTrading:
    """Swing trade recommendations for 5-15 days"""

    def __init__(self, candles: List[Dict]):
        """
        candles: list of dict with keys: timestamp, open, high, low, close, volume
        """
        self.df = pd.DataFrame(candles)
        if not self.df.empty:
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
            self.df = self.df.sort_values('timestamp').reset_index(drop=True)
            self._calculate()

    def _calculate(self):
        """Calculate indicators"""
        close = self.df['close']

        # Moving averages
        self.df['sma20'] = ta.sma(close, length=20)
        self.df['sma50'] = ta.sma(close, length=50)
        self.df['ema9'] = ta.ema(close, length=9)

        # RSI
        self.df['rsi'] = ta.rsi(close, length=14)

        # MACD
        macd = ta.macd(close)
        if macd is not None and not macd.empty:
            self.df['macd'] = macd['MACD_12_26_9']
            self.df['macd_signal'] = macd['MACDs_12_26_9']
            self.df['macd_hist'] = macd['MACDh_12_26_9']

        # ATR for stop loss
        self.df['atr'] = ta.atr(self.df['high'], self.df['low'], close, length=14)

        # Bollinger Bands
        bbands = ta.bbands(close)
        if bbands is not None and not bbands.empty:
            cols = bbands.columns.tolist()
            self.df['bb_upper'] = bbands[cols[0]]
            self.df['bb_lower'] = bbands[cols[2]]

        # Volume
        self.df['volume_sma20'] = ta.sma(self.df['volume'], length=20)

    def get_latest(self) -> Dict:
        """Get latest values"""
        if self.df.empty:
            return {}
        return self.df.iloc[-1].to_dict()

    def analyze(self) -> Dict:
        """Full swing trade analysis"""
        latest = self.get_latest()
        if not latest:
            return {}

        price = latest['close']
        rsi = latest.get('rsi', 50)
        sma20 = latest.get('sma20', price)
        sma50 = latest.get('sma50', price)
        atr = latest.get('atr', price * 0.02)
        bb_upper = latest.get('bb_upper', price * 1.03)
        bb_lower = latest.get('bb_lower', price * 0.97)

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

        # RSI signal
        if rsi > 70:
            rsi_signal = "OVERBOUGHT"
        elif rsi < 30:
            rsi_signal = "OVERSOLD"
        elif rsi > 60:
            rsi_signal = "BULLISH"
        elif rsi < 40:
            rsi_signal = "BEARISH"
        else:
            rsi_signal = "NEUTRAL"

        # MACD signal
        macd = latest.get('macd', 0)
        macd_signal = latest.get('macd_signal', 0)
        macd_hist = latest.get('macd_hist', 0)
        if macd_hist > 0:
            macd_trend = "BULLISH_CROSS"
        elif macd_hist < 0:
            macd_trend = "BEARISH_CROSS"
        else:
            macd_trend = "NEUTRAL"

        # Support/Resistance
        support = min(price - atr * 1.5, bb_lower)
        resistance = max(price + atr * 1.5, bb_upper)

        # Entry zone
        if trend in ["STRONG_BULLISH", "BULLISH"]:
            entry_min = price
            entry_max = price * 1.005
        else:
            entry_min = price * 0.995
            entry_max = price

        # Target & Stop Loss
        risk = atr * 1.5
        target_1 = price + risk * 2  # 1:2 risk reward
        target_2 = price + risk * 3  # 1:3 risk reward
        stop_loss = price - risk

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
            "price": round(price, 2),
            "trend": trend,
            "rsi": round(rsi, 1),
            "rsi_signal": rsi_signal,
            "macd": "BULLISH" if macd_hist > 0 else "BEARISH",
            "sma20": round(sma20, 2),
            "sma50": round(sma50, 2) if not pd.isna(sma50) else None,
            "support": round(support, 2),
            "resistance": round(resistance, 2),
            "atr": round(atr, 2),
            "entry_min": round(entry_min, 2),
            "entry_max": round(entry_max, 2),
            "target_1": round(target_1, 2),
            "target_2": round(target_2, 2),
            "stop_loss": round(stop_loss, 2),
            "risk_reward": 2,
            "recommendation": recommendation,
            "confidence": confidence,
            "timeframe": "5-15 days"
        }


def analyze_stock(candles: List[Dict]) -> Dict:
    """Main function for swing trade analysis"""
    st = SwingTrading(candles)
    return st.analyze()


def compare_stocks(stocks: Dict[str, List[Dict]]) -> List[Dict]:
    """Compare multiple stocks"""
    results = []
    for symbol, candles in stocks.items():
        analysis = analyze_stock(candles)
        analysis['symbol'] = symbol
        results.append(analysis)

    # Sort by confidence for BUY recommendations
    buy_recs = [r for r in results if 'BUY' in r['recommendation']]
    sell_recs = [r for r in results if 'SELL' in r['recommendation']]
    holds = [r for r in results if r['recommendation'] == 'HOLD']

    buy_recs.sort(key=lambda x: x['confidence'], reverse=True)
    sell_recs.sort(key=lambda x: x['confidence'], reverse=True)

    return {
        "strong_buys": buy_recs[:5],
        "strong_sells": sell_recs[:5],
        "holds": holds,
        "all_stocks": results
    }


if __name__ == "__main__":
    # Test
    import random
    candles = []
    price = 1300
    for i in range(60):
        price += random.uniform(-20, 25)
        candles.append({
            "timestamp": (datetime.now() - timedelta(days=60-i)).isoformat(),
            "open": price - random.uniform(5, 15),
            "high": price + random.uniform(5, 20),
            "low": price - random.uniform(10, 25),
            "close": price,
            "volume": random.randint(1000000, 5000000),
        })

    result = analyze_stock(candles)
    print("📊 Swing Trade Analysis")
    print("=" * 50)
    print(json.dumps(result, indent=2))
