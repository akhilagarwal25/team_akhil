#!/usr/bin/env python3
"""
Nivesh Tracker Module
Portfolio tracking and performance metrics
"""

import sys
sys.path.insert(0, '.venv/lib/python3.12/site-packages')

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional

DB_PATH = 'data/nivesh.db'


class NiveshTracker:
    """Track portfolio and performance"""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._init_db()

    def _init_db(self):
        """Initialize tracking tables"""
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT,
                entry_price REAL,
                quantity REAL,
                target_price REAL,
                stop_loss REAL,
                status TEXT DEFAULT 'OPEN',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                closed_at DATETIME,
                notes TEXT
            )
        ''')
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT,
                action TEXT,  -- BUY or SELL
                price REAL,
                quantity REAL,
                date DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.commit()

    def add_recommendation(self, symbol: str, entry_price: float,
                          quantity: float, target_price: float,
                          stop_loss: float, notes: str = '') -> int:
        """Add a new swing trade recommendation"""
        cursor = self.conn.execute('''
            INSERT INTO recommendations (symbol, entry_price, quantity, target_price, stop_loss, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (symbol, entry_price, quantity, target_price, stop_loss, notes))
        self.conn.commit()
        return cursor.lastrowid

    def close_recommendation(self, recommendation_id: int, status: str = 'TARGET'):
        """Close a recommendation (hit target or stopped out)"""
        self.conn.execute('''
            UPDATE recommendations
            SET status = ?, closed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (status, recommendation_id))
        self.conn.commit()

    def get_open_recommendations(self) -> List[Dict]:
        """Get all open recommendations"""
        cursor = self.conn.execute('''
            SELECT * FROM recommendations WHERE status = 'OPEN' ORDER BY created_at DESC
        ''')
        return self._rows_to_dict(cursor)

    def get_performance(self, days: int = 30) -> Dict:
        """Get performance metrics"""
        since = (datetime.now() - timedelta(days=days)).isoformat()

        # Get closed recommendations
        cursor = self.conn.execute('''
            SELECT * FROM recommendations
            WHERE status != 'OPEN' AND closed_at > ?
        ''', (since,))
        closed = self._rows_to_dict(cursor)

        if not closed:
            return {"total": 0, "wins": 0, "losses": 0, "accuracy": 0, "avg_gain": 0, "avg_loss": 0}

        wins = [r for r in closed if r['status'] == 'TARGET']
        losses = [r for r in closed if r['status'] == 'STOPPED']

        total = len(closed)
        accuracy = (len(wins) / total * 100) if total > 0 else 0

        # Calculate returns
        gains = []
        for r in wins:
            pct = ((r['target_price'] - r['entry_price']) / r['entry_price']) * 100
            gains.append(pct)

        losses_pct = []
        for r in losses:
            pct = ((r['entry_price'] - r['stop_loss']) / r['entry_price']) * 100
            losses_pct.append(pct)

        avg_gain = sum(gains) / len(gains) if gains else 0
        avg_loss = sum(losses_pct) / len(losses_pct) if losses_pct else 0

        return {
            "period_days": days,
            "total_trades": total,
            "wins": len(wins),
            "losses": len(losses),
            "accuracy": round(accuracy, 1),
            "avg_gain_percent": round(avg_gain, 2),
            "avg_loss_percent": round(avg_loss, 2),
            "win_loss_ratio": round(abs(avg_gain / avg_loss), 2) if avg_loss > 0 else 0,
            "expected_return": round(avg_gain * (accuracy/100) - avg_loss * ((100-accuracy)/100), 2)
        }

    def get_weekly_report(self) -> Dict:
        """Weekly performance report"""
        this_week = self.get_performance(7)
        this_month = self.get_performance(30)

        open_recs = self.get_open_recommendations()

        return {
            "week": this_week,
            "month": this_month,
            "open_positions": len(open_recs),
            "open_details": open_recs,
            "generated_at": datetime.now().isoformat()
        }

    def _rows_to_dict(self, cursor) -> List[Dict]:
        """Convert cursor rows to list of dicts"""
        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def close(self):
        """Close database connection"""
        self.conn.close()


def main():
    tracker = NiveshTracker()

    # Add test recommendation
    print("Adding test recommendation...")
    rec_id = tracker.add_recommendation(
        symbol='RELIANCE',
        entry_price=1320,
        quantity=10,
        target_price=1380,
        stop_loss=1290,
        notes='Swing trade - breakout play'
    )
    print(f"Added recommendation #{rec_id}")

    # Get performance
    print("\nPerformance (last 30 days):")
    perf = tracker.get_performance(30)
    print(json.dumps(perf, indent=2))

    # Weekly report
    print("\nWeekly Report:")
    report = tracker.get_weekly_report()
    print(json.dumps(report, indent=2))

    # Open recommendations
    print("\nOpen Recommendations:")
    open_recs = tracker.get_open_recommendations()
    for rec in open_recs:
        print(f"  {rec['symbol']}: ₹{rec['entry_price']} → ₹{rec['target_price']}")

    tracker.close()


if __name__ == '__main__':
    main()
