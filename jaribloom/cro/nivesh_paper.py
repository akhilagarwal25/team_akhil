#!/usr/bin/env python3
"""
Nivesh Paper Trading Module — AGGRESSIVE MODE
Target: 20-25% monthly return (minimum: 15%)
"""

import sys
import os
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Optional

DB_PATH = '/opt/data/jaribloom/nivesh.db'

# AGGRESSIVE CONFIG — target 20-25% monthly
INITIAL_CAPITAL = 100000       # Rs 1 lakh
MAX_POSITIONS = 3              # Fewer, bigger positions
MAX_POSITION_SIZE = 0.33       # 33% per trade (3 trades = near full capital)
STOP_LOSS_PCT = 0.015         # 1.5% hard stop (tighter)
TAKE_PROFIT_PCT = 0.10        # 10% per trade (3 trades = 30%+ monthly potential)
TRAILING_STOP = True           # Activate trailing stop after 5% gain
MAX_DAILY_TRADES = 2          # Max new entries per day
REBALANCE_WEEKLY = True        # Exit and re-enter weekly for fresh signals


def init_db():
    conn = sqlite3.connect(DB_PATH)
    
    conn.execute('''CREATE TABLE IF NOT EXISTS paper_portfolio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        total_value REAL,
        cash REAL,
        positions_value REAL,
        daily_pnl REAL,
        total_pnl REAL,
        day_return_pct REAL,
        total_return_pct REAL,
        benchmark_nifty50 REAL DEFAULT 100,
        benchmark_value REAL DEFAULT 100000,
        target_return_pct REAL DEFAULT 0
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS paper_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT,
        entry_price REAL,
        quantity REAL,
        entry_date TEXT,
        stop_loss REAL,
        take_profit REAL,
        target_price REAL,
        trailing_stop REAL,
        rationale TEXT,
        rsi_at_entry REAL,
        conf_at_entry REAL,
        verdict TEXT,
        catalyst TEXT,
        current_price REAL,
        unrealized_pnl REAL,
        unrealized_pnl_pct REAL,
        peak_price REAL,
        status TEXT DEFAULT 'open',
        tier TEXT DEFAULT 'A'
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS paper_trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT,
        action TEXT,
        price REAL,
        quantity REAL,
        value REAL,
        pnl REAL,
        pnl_pct REAL,
        exit_reason TEXT,
        holding_days INTEGER,
        entry_date TEXT,
        exit_date TEXT,
        rationale TEXT,
        rsi_at_entry REAL,
        verdict TEXT,
        target_return_pct REAL,
        benchmark_at_entry REAL,
        benchmark_at_exit REAL,
        alpha REAL
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS paper_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        period TEXT,
        total_trades INTEGER,
        winning_trades INTEGER,
        losing_trades INTEGER,
        win_rate_pct REAL,
        avg_win_pct REAL,
        avg_loss_pct REAL,
        avg_holding_days REAL,
        total_pnl REAL,
        total_return_pct REAL,
        target_return_pct REAL,
        target_met TEXT,
        sharpe_ratio REAL,
        max_drawdown_pct REAL,
        total_return_benchmark REAL,
        alpha_vs_benchmark REAL
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS paper_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        symbol TEXT,
        price REAL,
        rsi REAL,
        rec TEXT,
        conf REAL,
        target REAL,
        stop_loss REAL,
        verdict TEXT,
        rationale TEXT,
        executed INTEGER DEFAULT 0,
        trade_id INTEGER
    )''')
    
    conn.commit()
    conn.close()


def get_cash() -> float:
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT cash FROM paper_portfolio ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return row[0] if row else INITIAL_CAPITAL


def get_open_positions() -> list:
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT symbol, entry_price, current_price, unrealized_pnl, unrealized_pnl_pct, stop_loss, take_profit, trailing_stop, peak_price FROM paper_positions WHERE status='open'"
    ).fetchall()
    conn.close()
    return rows


def open_position(symbol: str, price: float, qty: float, stop_loss: float,
                  take_profit: float, target: float, rationale: str,
                  rsi: float, conf: int, verdict: str, catalyst: str = ""):
    conn = sqlite3.connect(DB_PATH)
    
    # Check existing
    existing = conn.execute(
        "SELECT id FROM paper_positions WHERE symbol=? AND status='open'", (symbol,)
    ).fetchone()
    if existing:
        conn.close()
        return False, "Already have position"
    
    pos_count = conn.execute(
        "SELECT COUNT(*) FROM paper_positions WHERE status='open'"
    ).fetchone()[0]
    if pos_count >= MAX_POSITIONS:
        conn.close()
        return False, f"Max positions ({MAX_POSITIONS}) reached"
    
    # Tier assignment based on conviction
    tier = 'A' if conf >= 70 else 'B' if conf >= 60 else 'C'
    
    cash = get_cash()
    cost = price * qty
    
    if cost > cash * MAX_POSITION_SIZE:
        qty = (cash * MAX_POSITION_SIZE) / price
    
    if price * qty > cash:
        conn.close()
        return False, f"Insufficient cash"
    
    conn.execute('''INSERT INTO paper_positions
        (symbol, entry_price, quantity, entry_date, stop_loss, take_profit,
         target_price, trailing_stop, rationale, rsi_at_entry, conf_at_entry,
         current_price, unrealized_pnl, unrealized_pnl_pct, peak_price,
         status, tier, target_return_pct, verdict, catalyst)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (symbol, price, qty, datetime.now().isoformat(), stop_loss, take_profit,
         target, price * 1.05, rationale, rsi, conf, price, 0, 0, price,
         'open', tier, 10.0, verdict, catalyst))
    
    pos_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    
    # Deduct cash
    cash = get_cash() - (price * qty)
    conn.execute("UPDATE paper_portfolio SET cash=? WHERE id=(SELECT MAX(id) FROM paper_portfolio)",
                 (cash,))
    
    conn.commit()
    conn.close()
    
    return True, f"BUY {symbol}: {qty:.1f} shares @ Rs{price} | SL:Rs{stop_loss} | TP:Rs{take_profit} | TIER:{tier}"


def close_position(symbol: str, exit_price: float, reason: str):
    conn = sqlite3.connect(DB_PATH)
    
    pos = conn.execute(
        "SELECT id, entry_price, quantity, entry_date, stop_loss, take_profit, rationale, rsi_at_entry, verdict, catalyst FROM paper_positions WHERE symbol=? AND status='open'",
        (symbol,)
    ).fetchone()
    
    if not pos:
        conn.close()
        return False, "No open position"
    
    pos_id, entry_price, qty, entry_date, stop_loss, take_profit, rationale, rsi_entry, verdict, catalyst = pos
    
    pnl = (exit_price - entry_price) * qty
    pnl_pct = (exit_price / entry_price - 1) * 100
    holding_days = max(1, (datetime.now() - datetime.fromisoformat(entry_date)).days)
    target_return = TAKE_PROFIT_PCT * 100
    
    # Alpha calculation
    bench_entry = conn.execute("SELECT benchmark_nifty50 FROM paper_portfolio ORDER BY id ASC LIMIT 1").fetchone()
    bench_exit = conn.execute("SELECT benchmark_nifty50 FROM paper_portfolio ORDER BY id DESC LIMIT 1").fetchone()
    bench_entry_val = bench_entry[0] if bench_entry else 100
    bench_exit_val = bench_exit[0] if bench_exit else 100
    alpha = pnl_pct - ((bench_exit_val / bench_entry_val - 1) * 100)
    
    conn.execute('''INSERT INTO paper_trades
        (symbol, action, price, quantity, value, pnl, pnl_pct, exit_reason,
         holding_days, entry_date, exit_date, rationale, rsi_at_entry,
         verdict, target_return_pct, benchmark_at_entry, benchmark_at_exit, alpha)
        VALUES (?, 'BUY', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (symbol, entry_price, qty, entry_price * qty, pnl, pnl_pct, reason,
         holding_days, entry_date, datetime.now().isoformat(), rationale, rsi_entry,
         verdict, target_return, bench_entry_val, bench_exit_val, alpha))
    
    conn.execute("UPDATE paper_positions SET status='closed', current_price=? WHERE id=?",
                 (exit_price, pos_id))
    
    # Return cash + pnl
    cash = get_cash() + (exit_price * qty)
    conn.execute("UPDATE paper_portfolio SET cash=? WHERE id=(SELECT MAX(id) FROM paper_portfolio)",
                 (cash,))
    
    conn.commit()
    conn.close()
    
    return True, f"CLOSED {symbol}: {'+' if pnl >= 0 else ''}Rs{pnl:.0f} ({pnl_pct:+.1f}%) | {reason}"


def update_positions_prices(prices: dict):
    """Update prices + trailing stop + auto-exit"""
    conn = sqlite3.connect(DB_PATH)
    
    positions = conn.execute(
        "SELECT id, symbol, entry_price, quantity, stop_loss, take_profit, trailing_stop, peak_price FROM paper_positions WHERE status='open'"
    ).fetchall()
    
    exits = []
    
    for pos in positions:
        pos_id, symbol, entry, qty, sl, tp, ts, peak = pos
        current = prices.get(symbol)
        if not current:
            continue
        
        pnl = (current - entry) * qty
        pnl_pct = (current / entry - 1) * 100
        
        # Update peak
        new_peak = max(float(peak or 0), current)
        
        # Trailing stop logic: after 5% gain, move SL to entry
        new_trailing = float(ts or 0)
        if pnl_pct >= 5.0 and entry > new_trailing:
            new_trailing = entry  # Lock in profit at breakeven
        elif pnl_pct >= 8.0:
            new_trailing = entry + (new_peak - entry) * 0.5  # Trail 50% of gains after 8%
        
        # Check exits
        exit_reason = None
        if current <= sl:
            exit_reason = "STOP_LOSS"
        elif current >= tp:
            exit_reason = "TAKE_PROFIT"
        elif TRAILING_STOP and new_trailing > 0 and current <= new_trailing:
            exit_reason = "TRAILING_STOP"
        else:
            # Check time stop
            entry_row = conn.execute(
                "SELECT entry_date FROM paper_positions WHERE id=?", (pos_id,)
            ).fetchone()
            if entry_row:
                entry_dt = datetime.fromisoformat(entry_row[0])
                if (datetime.now() - entry_dt).days > 14:
                    exit_reason = "TIME_STOP"
        
        if exit_reason:
            exits.append((symbol, current, exit_reason, pnl, pnl_pct, qty))
            conn.execute("UPDATE paper_positions SET status='closed' WHERE id=?", (pos_id,))
        else:
            conn.execute(
                "UPDATE paper_positions SET current_price=?, unrealized_pnl=?, unrealized_pnl_pct=?, peak_price=?, trailing_stop=? WHERE id=?",
                (current, pnl, pnl_pct, new_peak, new_trailing, pos_id)
            )
    
    conn.commit()
    conn.close()
    
    # Execute exits
    for symbol, exit_price, reason, pnl, pnl_pct, qty in exits:
        print(f"  AUTO-EXIT {symbol}: {'+' if pnl >= 0 else ''}Rs{pnl:.0f} ({pnl_pct:+.1f}%) — {reason}")
        close_position(symbol, exit_price, reason)
    
    return len(exits)


def snapshot_portfolio():
    conn = sqlite3.connect(DB_PATH)
    
    cash = get_cash()
    positions = conn.execute(
        "SELECT COALESCE(SUM(quantity * current_price),0) FROM paper_positions WHERE status='open'"
    ).fetchone()[0] or 0
    total = cash + positions
    
    last = conn.execute("SELECT total_value FROM paper_portfolio ORDER BY id DESC LIMIT 1").fetchone()
    prev_total = last[0] if last else INITIAL_CAPITAL
    
    daily_pnl = total - prev_total
    total_pnl = total - INITIAL_CAPITAL
    day_return = (daily_pnl / prev_total * 100) if prev_total else 0
    total_return = (total_pnl / INITIAL_CAPITAL * 100)
    
    # Monthly target check
    # Get portfolio age in days
    first_snapshot = conn.execute("SELECT timestamp FROM paper_portfolio ORDER BY id ASC LIMIT 1").fetchone()
    days_running = 1
    if first_snapshot:
        age = datetime.now() - datetime.fromisoformat(first_snapshot[0])
        days_running = max(1, age.days)
    
    monthly_target = (1.20 ** (30 / days_running) - 1) * 100 if days_running > 1 else 0
    
    conn.execute('''INSERT INTO paper_portfolio
        (timestamp, total_value, cash, positions_value, daily_pnl, total_pnl,
         day_return_pct, total_return_pct, target_return_pct)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (datetime.now().isoformat(), total, cash, positions,
         daily_pnl, total_pnl, day_return, total_return, monthly_target))
    conn.commit()
    conn.close()
    
    return {
        'total': total, 'cash': cash, 'positions': positions,
        'daily_pnl': daily_pnl, 'total_pnl': total_pnl,
        'total_return': total_return, 'monthly_target': monthly_target
    }


def execute_paper_trades(prices: dict, analysis_results: list):
    """Execute paper trades based on signals + news research"""
    conn = sqlite3.connect(DB_PATH)
    
    # Check daily trade limit
    today = datetime.now().date().isoformat()
    today_trades = conn.execute(
        "SELECT COUNT(*) FROM paper_positions WHERE status='open' AND date(entry_date)=?",
        (today,)
    ).fetchone()[0]
    
    if today_trades >= MAX_DAILY_TRADES:
        print(f"  Daily trade limit reached ({MAX_DAILY_TRADES})")
        conn.close()
        return []
    
    remaining_slots = MAX_POSITIONS - conn.execute(
        "SELECT COUNT(*) FROM paper_positions WHERE status='open'"
    ).fetchone()[0]
    
    if remaining_slots <= 0:
        print("  All positions full")
        conn.close()
        return []
    
    # Build signals from analysis + research
    signals = []
    for a in analysis_results:
        sym = a.get('symbol', '')
        price = prices.get(sym) or a.get('price')
        rsi = a.get('rsi')
        rec = a.get('rec', '')
        conf = int(a.get('conf', 60))
        verdict = a.get('verdict', rec)
        catalyst = a.get('catalyst', a.get('headlines', '')[:200])
        rationale = a.get('rationale', a.get('sector_outlook', ''))
        
        if not price or not rsi:
            continue
        
        price = float(price)
        stop_loss = float(a.get('stop_loss', price * (1 - STOP_LOSS_PCT)))
        take_profit = float(a.get('target', price * (1 + TAKE_PROFIT_PCT)))
        entry_qty = (INITIAL_CAPITAL * MAX_POSITION_SIZE) / price
        
        signals.append({
            'symbol': sym, 'price': price, 'rsi': rsi, 'rec': rec,
            'conf': conf, 'stop_loss': stop_loss, 'take_profit': take_profit,
            'target': take_profit, 'verdict': verdict, 'catalyst': catalyst,
            'rationale': rationale, 'qty': entry_qty
        })
    
    # Sort by conviction (conf) + RSI extremity
    signals.sort(key=lambda x: (x['conf'], abs(50 - float(x['rsi'] or 50)), float(x['rsi'] or 50)), reverse=True)
    
    results = []
    for sig in signals[:remaining_slots]:
        ok, msg = open_position(
            sig['symbol'], sig['price'], sig['qty'],
            sig['stop_loss'], sig['take_profit'], sig['target'],
            f"{sig['verdict']}: {sig['rationale']}"[:200],
            float(sig['rsi']), sig['conf'],
            sig['verdict'], sig['catalyst']
        )
        results.append((sig['symbol'], ok, msg))
        print(f"  {msg}")
    
    conn.close()
    return results


def update_performance_metrics():
    conn = sqlite3.connect(DB_PATH)
    
    trades = conn.execute(
        "SELECT pnl, pnl_pct, holding_days, exit_reason FROM paper_trades"
    ).fetchall()
    
    if not trades:
        conn.close()
        return None
    
    total = len(trades)
    wins = [t for t in trades if t[0] > 0]
    losses = [t for t in trades if t[0] <= 0]
    
    win_rate = len(wins) / total * 100
    avg_win = sum(t[1] for t in wins) / len(wins) if wins else 0
    avg_loss = sum(t[1] for t in losses) / len(losses) if losses else 0
    avg_holding = sum(t[2] for t in trades) / len(trades)
    total_pnl = sum(t[0] for t in trades)
    total_return = (total_pnl / INITIAL_CAPITAL) * 100
    
    # Period check
    first_trade = conn.execute("SELECT exit_date FROM paper_trades ORDER BY id ASC LIMIT 1").fetchone()
    period = "daily"
    if first_trade:
        age = (datetime.now() - datetime.fromisoformat(first_trade[0].replace('Z','+00:00') if 'Z' in first_trade[0] else first_trade[0])).days
        period = "daily" if age < 7 else "weekly" if age < 30 else "monthly"
    
    # Target
    target_pct = 20.0 if period == "weekly" else 20.0 if period == "monthly" else 1.0
    target_met = "YES" if total_return >= target_pct else "PARTIAL" if total_return >= 15.0 else "NO"
    
    # Alpha
    bench_start = conn.execute("SELECT benchmark_nifty50 FROM paper_portfolio ORDER BY id ASC LIMIT 1").fetchone()
    bench_end = conn.execute("SELECT benchmark_nifty50 FROM paper_portfolio ORDER BY id DESC LIMIT 1").fetchone()
    bench_return = 0
    if bench_start and bench_end:
        bench_return = (bench_end[0] / bench_start[0] - 1) * 100
    alpha = total_return - bench_return
    
    conn.execute('''INSERT INTO paper_metrics
        (timestamp, period, total_trades, winning_trades, losing_trades, win_rate_pct,
         avg_win_pct, avg_loss_pct, avg_holding_days, total_pnl, total_return_pct,
         target_return_pct, target_met, alpha_vs_benchmark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (datetime.now().isoformat(), period, total, len(wins), len(losses), win_rate,
         avg_win, avg_loss, avg_holding, total_pnl, total_return,
         target_pct, target_met, alpha))
    conn.commit()
    conn.close()
    
    return {
        'total': total, 'wins': len(wins), 'losses': len(losses),
        'win_rate': win_rate, 'avg_win': avg_win, 'avg_loss': avg_loss,
        'total_return': total_return, 'alpha': alpha, 'target_met': target_met
    }


def get_full_report() -> str:
    conn = sqlite3.connect(DB_PATH)
    
    latest = conn.execute(
        "SELECT total_value, cash, positions_value, daily_pnl, total_pnl, total_return_pct, target_return_pct FROM paper_portfolio ORDER BY id DESC LIMIT 1"
    ).fetchone()
    
    metrics = conn.execute(
        "SELECT period, total_trades, winning_trades, losing_trades, win_rate_pct, avg_win_pct, avg_loss_pct, total_return_pct, target_return_pct, target_met, alpha_vs_benchmark FROM paper_metrics ORDER BY id DESC LIMIT 1"
    ).fetchone()
    
    open_pos = conn.execute(
        "SELECT symbol, entry_price, current_price, quantity, unrealized_pnl, unrealized_pnl_pct, stop_loss, take_profit, tier, verdict FROM paper_positions WHERE status='open'"
    ).fetchall()
    
    recent_trades = conn.execute(
        "SELECT symbol, pnl, pnl_pct, exit_reason, holding_days FROM paper_trades ORDER BY id DESC LIMIT 10"
    ).fetchall()
    
    conn.close()
    
    if not latest:
        return f"Portfolio: Rs{INITIAL_CAPITAL:,} | No trades yet"
    
    total, cash, positions, daily_pnl, total_pnl, total_ret, monthly_tgt = latest
    
    lines = []
    lines.append(f"\n{'='*80}")
    lines.append(f"  NIVESH PAPER TRADING — AGGRESSIVE MODE")
    lines.append(f"  {datetime.now().strftime('%Y-%m-%d %H:%M IST')}")
    lines.append(f"  TARGET: 20-25%/month (min: 15%)")
    lines.append(f"{'='*80}")
    lines.append(f"  PORTFOLIO: Rs{total:,.0f}  |  Cash: Rs{cash:,.0f}  |  Positions: Rs{positions:,.0f}")
    lines.append(f"  TOTAL P&L: {'+' if total_pnl >= 0 else ''}Rs{total_pnl:,.0f} ({total_ret:+.2f}%)")
    lines.append(f"  TODAY: {'+' if daily_pnl >= 0 else ''}Rs{daily_pnl:,.0f}")
    lines.append(f"  MONTHLY TARGET: {monthly_tgt:.1f}%")
    
    if metrics:
        period, tt, wins, losses, wr, aw, al, ret, tgt, tgt_met, alpha = metrics
        status_emoji = "YES" if tgt_met == "YES" else "PARTIAL" if tgt_met == "PARTIAL" else "NO"
        lines.append(f"\n  PERFORMANCE ({period}):")
        lines.append(f"    Trades: {tt} total | {wins}W / {losses}L | Win rate: {wr:.0f}%")
        lines.append(f"    Avg win: {aw:+.2f}% | Avg loss: {al:+.2f}% | Alpha: {'+' if alpha >= 0 else ''}{alpha:.2f}%")
        lines.append(f"    Return: {ret:+.2f}% | Target: {tgt:.0f}% | TARGET MET: {status_emoji}")
    
    if open_pos:
        lines.append(f"\n  OPEN POSITIONS:")
        for p in open_pos:
            sym, entry, current, qty, pnl, pnl_pct, sl, tp, tier, verdict = p
            emoji = "+" if float(pnl or 0) >= 0 else "-"
            lines.append(f"    [{tier}] {sym:<12} Entry:Rs{entry:>8}  Now:Rs{current:>8}  P&L:{emoji}Rs{abs(float(pnl or 0)):>7.0f} ({float(pnl_pct or 0):+.1f}%)  SL:Rs{sl}  TP:Rs{tp}")
    
    if recent_trades:
        lines.append(f"\n  RECENT TRADES:")
        for t in recent_trades:
            sym, pnl, pnl_pct, reason, days = t
            emoji = "+" if float(pnl or 0) >= 0 else "-"
            lines.append(f"    {sym:<12} {emoji}Rs{abs(float(pnl or 0)):>7.0f} ({float(pnl_pct or 0):+.1f}%)  {reason or ''}  ({days}d)")
    
    lines.append(f"{'='*80}")
    return '\n'.join(lines)


if __name__ == '__main__':
    init_db()
    
    conn = sqlite3.connect(DB_PATH)
    count = conn.execute("SELECT COUNT(*) FROM paper_portfolio").fetchone()[0]
    if count == 0:
        conn.execute('''INSERT INTO paper_portfolio (timestamp, total_value, cash, positions_value, daily_pnl, total_pnl, day_return_pct, total_return_pct) VALUES (?, ?, ?, ?, 0, 0, 0, 0)''',
            (datetime.now().isoformat(), INITIAL_CAPITAL, INITIAL_CAPITAL, 0))
        conn.commit()
        print(f"Portfolio initialized: Rs{INITIAL_CAPITAL:,} | Target: 20-25%/month")
    conn.close()
    
    action = sys.argv[1] if len(sys.argv) > 1 else 'status'
    
    if action == 'status':
        print(get_full_report())
    elif action == 'report':
        print(get_full_report())
