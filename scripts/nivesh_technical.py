#!/usr/bin/env python3
"""
Nivesh Technical Analysis Module
Uses pandas-ta for advanced technical indicators
"""

import sys
sys.path.insert(0, '.venv/lib/python3.12/site-packages')

import pandas as pd
import pandas_ta as ta
from datetime import datetime, timedelta

class TechnicalAnalysis:
    """Advanced Technical Analysis using pandas-ta"""

    def __init__(self, candles):
        """
        candles: list of dict with keys: timestamp, open, high, low, close, volume
        """
        self.df = pd.DataFrame(candles)
        if not self.df.empty:
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
            self.df = self.df.sort_values('timestamp')
            self._calculate_indicators()

    def _calculate_indicators(self):
        """Calculate all technical indicators"""
        close = self.df['close']

        # Trend indicators
        self.df['sma_20'] = ta.sma(close, length=20)
        self.df['sma_50'] = ta.sma(close, length=50)
        self.df['sma_200'] = ta.sma(close, length=200)
        self.df['ema_12'] = ta.ema(close, length=12)
        self.df['ema_26'] = ta.ema(close, length=26)

        # RSI
        self.df['rsi_14'] = ta.rsi(close, length=14)
        self.df['rsi_7'] = ta.rsi(close, length=7)

        # MACD
        macd = ta.macd(close)
        if macd is not None and not macd.empty:
            self.df['macd'] = macd['MACD_12_26_9']
            self.df['macd_signal'] = macd['MACDs_12_26_9']
            self.df['macd_hist'] = macd['MACDh_12_26_9']

        # Bollinger Bands
        bbands = ta.bbands(close)
        if bbands is not None and not bbands.empty:
            cols = bbands.columns.tolist()
            self.df['bb_upper'] = bbands[cols[0]] if len(cols) >= 1 else price * 1.02
            self.df['bb_middle'] = bbands[cols[1]] if len(cols) >= 2 else price
            self.df['bb_lower'] = bbands[cols[2]] if len(cols) >= 3 else price * 0.98

        # ATR (Average True Range)
        self.df['atr_14'] = ta.atr(self.df['high'], self.df['low'], close, length=14)

        # Stochastic
        stoch = ta.stoch(self.df['high'], self.df['low'], close)
        if stoch is not None and not stoch.empty:
            self.df['stoch_k'] = stoch['STOCHk_14_3_3']
            self.df['stoch_d'] = stoch['STOCHd_14_3_3']

        # ADX (Trend Strength)
        self.df['adx_14'] = ta.adx(self.df['high'], self.df['low'], close, length=14)['ADX_14']

        # Volume indicators
        self.df['volume_sma_20'] = ta.sma(self.df['volume'], length=20)

    def get_latest(self):
        """Get latest values"""
        if self.df.empty:
            return None
        return self.df.iloc[-1].to_dict()

    def get_summary(self):
        """Get technical analysis summary"""
        latest = self.get_latest()
        if latest is None:
            return {}

        price = latest['close']
        rsi = latest.get('rsi_14', 50)
        sma20 = latest.get('sma_20', price)
        sma50 = latest.get('sma_50', price)

        # Trend
        if price > sma20 > sma50:
            trend = "BULLISH"
        elif price < sma20 < sma50:
            trend = "BEARISH"
        else:
            trend = "NEUTRAL"

        # RSI interpretation
        if rsi > 70:
            rsi_signal = "OVERBOUGHT"
        elif rsi < 30:
            rsi_signal = "OVERSOLD"
        else:
            rsi_signal = "NEUTRAL"

        # Support/Resistance
        bb_upper = latest.get('bb_upper', price * 1.02)
        bb_lower = latest.get('bb_lower', price * 0.98)

        return {
            "price": price,
            "trend": trend,
            "rsi": rsi,
            "rsi_signal": rsi_signal,
            "sma_20": sma20,
            "sma_50": sma50,
            "support": bb_lower,
            "resistance": bb_upper,
            "atr": latest.get('atr_14', 0),
            "volume": latest['volume'],
            "volume_ratio": latest['volume'] / latest.get('volume_sma_20', 1) if latest.get('volume_sma_20') else 1,
            "macd": latest.get('macd', 0),
            "macd_signal": latest.get('macd_signal', 0),
        }


def analyze_candles(candles):
    """Main analysis function"""
    ta = TechnicalAnalysis(candles)
    return {
        "summary": ta.get_summary(),
        "latest": ta.get_latest(),
    }


# Test
if __name__ == "__main__":
    # Sample data
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

    result = analyze_candles(candles)
    print("📊 Technical Analysis Results")
    print("=" * 40)
    summary = result['summary']
    print(f"Price: ₹{summary['price']:.2f}")
    print(f"Trend: {summary['trend']}")
    print(f"RSI: {summary['rsi']:.1f} ({summary['rsi_signal']})")
    print(f"Support: ₹{summary['support']:.2f}")
    print(f"Resistance: ₹{summary['resistance']:.2f}")
