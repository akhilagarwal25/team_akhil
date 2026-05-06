#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# TEAM AKHIL — VPS Setup Script
# Run this ONCE on a fresh Contabo VPS (Ubuntu 22.04)
# ═══════════════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════"
echo "  TEAM AKHIL — VPS SETUP"
echo "═══════════════════════════════════════════════════════"

# ── 1. SYSTEM UPDATE ────────────────────────────────────────────────
echo ""
echo "[1/11] Updating system..."
apt update && apt upgrade -y

# ── 2. CORE DEPENDENCIES ────────────────────────────────────────────
echo ""
echo "[2/11] Installing dependencies..."

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
apt install -y git curl wget
apt install -y postgresql postgresql-contrib
apt install -y redis-server
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
npm install -g pm2
apt install -y nginx
systemctl enable nginx
apt install -y certbot python3-certbot-nginx

echo "  Dependencies installed."

# ── 3. POSTGRESQL ──────────────────────────────────────────────
echo ""
echo "[3/11] Setting up PostgreSQL..."

# Generate secure password
DB_PASSWORD=$(openssl rand -hex 32)
echo "  DB password generated (saved to .env later)"

sudo -u postgres psql << PGEOF
CREATE DATABASE teamakhil;
CREATE USER teamadmin WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE teamakhil TO teamadmin;
ALTER USER teamadmin WITH SUPERUSER;
PGEOF

systemctl restart postgresql
echo "  PostgreSQL ready."

# ── 4. REDIS ─────────────────────────────────────────────────
echo ""
echo "[4/11] Setting up Redis..."
systemctl enable redis
systemctl restart redis
echo "  Redis ready."

# ── 5. NGINX ────────────────────────────────────────────────
echo ""
echo "[5/11] Setting up Nginx..."

cat > /etc/nginx/sites-available/team-akhil << 'NGINXEOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_HERE;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/team-akhil /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
echo "  Nginx configured."

# ── 6. CLAUDE CODE CLI ──────────────────────────────────────────────
echo ""
echo "[6/11] Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code
echo "  Claude Code installed."

# ── 7. COMMAND CODE CLI ──────────────────────────────────────────
echo ""
echo "[7/11] Installing Command Code CLI..."

npm install -g command-code

mkdir -p ~/.commandcode
cat > ~/.commandcode/auth.json << 'CCAUTH_EOF'
{
  "apiKey": "user_COMMANDCODE_APIKEY_HERE",
  "userId": "YOUR_USER_ID",
  "userName": "ahkilagarwal25",
  "keyName": "vps-cli",
  "authenticatedAt": "2026-05-06T00:00:00.000Z"
}
CCAUTH_EOF
chmod 600 ~/.commandcode/auth.json

cat > /usr/local/bin/ccdispatch << 'CCDISP_EOF'
#!/bin/bash
# Dispatch task to Command Code (non-interactive with retry)
# Usage: ccdispatch "your task description"
TRIES=0
MAX_TRIES=3
while [ $TRIES -lt $MAX_TRIES ]; do
  result=$(node /usr/local/lib/node_modules/command-code/dist/index.mjs -p "$1" --auto-accept --skip-onboarding --trust 2>&1)
  if echo "$result" | grep -q "error|rate.limit|exhausted"; then
    TRIES=$((TRIES + 1))
    echo "Attempt $TRIES failed, retrying in 10s..."
    sleep 10
  else
    echo "$result"
    exit 0
  fi
done
echo "All attempts failed after $MAX_TRIES tries"
exit 1
CCDISP_EOF
chmod +x /usr/local/bin/ccdispatch
echo "  Command Code installed."

# ── 8. CLONE & BUILD ─────────────────────────────────────────────
echo ""
echo "[8/11] Cloning team-akhil repo..."

cd /var/www
git clone https://github.com/akhilagarwal25/team-akhil.git
cd team-akhil
npm install
npm run build
echo "  team-akhil cloned and built."

# ── 9. CONFIG FILES ───────────────────────────────────────────────
echo ""
echo "[9/11] Creating config files..."

# .env
cat > .env << ENV_EOF
# AI / OpenRouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_OPENROUTER_KEY_HERE
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
# Priority: paid models under $0.21/1M tokens. Retry on exhaustion.
OPENROUTER_MODEL_PRIORITY=deepseek/deepseek-chat-v3-0324,qwen/qwen3-14b,google/gemma-4-26b-a4b-it,meta-llama/llama-3.3-70b-instruct,google/gemini-2.5-pro-exp-03-25
OPENROUTER_MAX_PRICE=0.21
OPENROUTER_RETRY_COUNT=3

# Claude
ANTHROPIC_AUTH_TOKEN=sk-cp-YOUR_ANTHROPIC_TOKEN_HERE
ANTHROPIC_BASE_URL=https://api.codemax.pro

# Command Code
COMMANDCODE_API_KEY=user_YOUR_COMMANDCODE_APIKEY_HERE

# Database
DATABASE_URL=postgresql://teamadmin:${DB_PASSWORD}@localhost:5432/teamakhil

# Redis
REDIS_URL=redis://localhost:6379

# Telegram
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_TELEGRAM_CHAT_ID

# Shopify
SHOPIFY_SHOP_URL=https://jaribooti.myshopify.com
SHOPIFY_ACCESS_TOKEN=YOUR_SHOPIFY_TOKEN

# n8n
N8N_URL=http://localhost:5678
N8N_API_KEY=YOUR_N8N_API_KEY

# WMS
WMS_API_URL=http://localhost:8001
WMS_API_KEY=YOUR_WMS_API_KEY
ENV_EOF

# Claude Code settings
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'CLAUDE_SETTINGS_EOF'
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-cp-YOUR_ANTHROPIC_TOKEN_HERE",
    "ANTHROPIC_BASE_URL": "https://api.codemax.pro",
    "OPENROUTER_API_KEY": "sk-or-v1-YOUR_OPENROUTER_KEY_HERE",
    "OPENROUTER_BASE_URL": "https://openrouter.ai/api/v1",
    "OPENROUTER_MODEL_PRIORITY": "deepseek/deepseek-chat-v3-0324,qwen/qwen3-14b,google/gemma-4-26b-a4b-it,meta-llama/llama-3.3-70b-instruct",
    "OPENROUTER_MAX_PRICE": "0.21",
    "OPENROUTER_RETRY_COUNT": "3"
  },
  "model": "opus[1m]",
  "autoUpdatesChannel": "latest"
}
CLAUDE_SETTINGS_EOF

# CLAUDE.md
cat > CLAUDE.md << 'CLAUDE_MD_EOF'
# team-akhil — AI Employee Command Center

## Stack
Next.js 16 | PostgreSQL | Redis | PM2 | n8n | Claude Code | Command Code

## Architecture
Agent Factory -> Orchestrator (CEO) -> AI Employees -> Mobile App

## Workflow
GitHub push -> VPS executes -> Telegram reports

## Commands
npm run dev     — development
npm run build  — production build
npm run db:migrate — run migrations
pm2 logs       — view logs
graphify update . — update knowledge graph
CLAUDE_MD_EOF

echo "  Config files created."

# ── 10. TELEGRAM BOT ────────────────────────────────────────────────
echo ""
echo "[10/11] Setting up Telegram bot..."

cat > scripts/telegram-bot.ts << 'TELEGRAMEOF'
#!/usr/bin/env node
/**
 * Telegram Bot — GitHub instructions -> Claude executes -> Telegram reports
 *
 * WORKFLOW:
 * 1. Push task to GitHub (instructions.md)
 * 2. Bot detects new task
 * 3. Claude Code executes
 * 4. Progress updates sent to Telegram
 * 5. Final report sent to Telegram
 */

import TelegramBot from 'node-telegram-bot-api';
import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID_HERE';
const REPO_DIR = '/var/www/team-akhil';
const INSTRUCTIONS_FILE = join(REPO_DIR, 'instructions.md');
const REPORT_DIR = join(REPO_DIR, 'reports');

let bot: TelegramBot;
try {
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
} catch (e) {
  console.error('Bot init failed:', e);
  process.exit(1);
}

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

function run(cmd: string, cwd = REPO_DIR): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', timeout: 600000, maxBuffer: 50 * 1024 * 1024 }).toString();
  } catch (e: any) {
    return (e.stdout?.toString() || e.message || '').toString();
  }
}

async function send(msg: string) {
  try {
    await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'Markdown' });
  } catch (e: any) {
    log('Telegram send failed: ' + e.message);
  }
}

async function executeTask(instructions: string) {
  // Write instructions to file
  writeFileSync(INSTRUCTIONS_FILE, instructions);

  // Git add + commit + push
  run('git add instructions.md');
  run('git commit -m "task: ' + instructions.substring(0, 50).replace(/'/g, "''") + '"');
  run('git push origin main');

  // Send start message
  await send('🤖 *Task received*\n\n`' + instructions.substring(0, 200) + '...`\n\nExecuting...');

  log('Running Claude: ' + instructions.substring(0, 100));

  let output = '';
  let lastUpdate = Date.now();

  try {
    const proc = spawn('npx', ['claude', '-p', instructions, '--output-format', 'stream-json'], {
      cwd: REPO_DIR,
      env: { ...process.env },
    });

    proc.stdout?.on('data', async (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;

      if (Date.now() - lastUpdate > 30000) {
        lastUpdate = Date.now();
        const preview = chunk.substring(0, 300).replace(/[*_`]/g, '');
        await send('⚙️ *Progress*\n\n' + preview + '...');
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      log('Claude stderr: ' + data.toString().substring(0, 200));
    });

    await new Promise<void>((res, rej) => {
      proc.on('close', (code) => {
        if (code === 0) res();
        else rej(new Error('Exit code: ' + code));
      });
      proc.on('error', rej);
      setTimeout(() => { proc.kill(); rej(new Error('Timeout')); }, 600000);
    });
  } catch (e: any) {
    log('Execution error: ' + e.message);
    await send('⚠️ *Execution error:*\n`' + e.message.substring(0, 500) + '`');
    return;
  }

  // Save report
  mkdirSync(REPORT_DIR, { recursive: true });
  const reportFile = join(REPORT_DIR, `${Date.now()}.md`);
  const report = '# Task Report\n\n**Time:** ' + new Date().toISOString() + '\n\n## Instructions\n' + instructions + '\n\n## Output\n' + output + '\n\n## Status: COMPLETE';
  writeFileSync(reportFile, report);

  // Git push report
  run('git add reports/ instructions.md');
  run('git commit -m "report: ' + new Date().toISOString() + '"');
  run('git push origin main');

  // Send summary to Telegram
  const summary = output.substring(0, 1000).replace(/[*_`#]/g, '');
  await send('✅ *Task Complete*\n\n' + summary + '\n\n📁 Report pushed to GitHub');

  // Clear instructions
  writeFileSync(INSTRUCTIONS_FILE, '');
  run('git add instructions.md');
  run('git commit -m "chore: clear processed instructions"');
  run('git push origin main');

  log('Task complete');
}

// Bot commands
bot.on('message', async (msg) => {
  if (!msg.text || msg.chat.id.toString() !== CHAT_ID) return;
  const text = msg.text.trim();
  log('Message: ' + text.substring(0, 100));

  if (text.startsWith('/start')) {
    await send('🤖 *Team Akhil Bot Active*\n\nSend a task and I\'ll execute it via Claude Code.\n\nExample: "Show me today\'s sales report"');
    return;
  }

  if (text.startsWith('/status')) {
    await send('✅ Bot running\nClaude Code active\nGitHub: github.com/akhilagarwal25/team-akhil\n\nWaiting for task...');
    return;
  }

  if (text.startsWith('/reports')) {
    const reports = run('ls -t reports/ 2>/dev/null | head -5');
    await send('📁 *Recent reports:*\n\n' + (reports || 'No reports yet'));
    return;
  }

  // Treat as task
  await executeTask(text);
});

// Poll GitHub every 2 minutes for new tasks
setInterval(() => {
  try {
    run('git pull origin main');
    if (existsSync(INSTRUCTIONS_FILE)) {
      const instructions = readFileSync(INSTRUCTIONS_FILE, 'utf8').trim();
      if (instructions && instructions.length > 10) {
        log('Found task from GitHub: ' + instructions.substring(0, 50));
        executeTask(instructions);
      }
    }
  } catch (e: any) {
    log('GitHub poll error: ' + e.message);
  }
}, 2 * 60 * 1000);

log('Telegram bot started');
console.log('Bot polling...');
TELEGRAMEOF

echo "  Telegram bot created."

# ── 11. PM2 ────────────────────────────────────────────────────
echo ""
echo "[11/11] Setting up PM2..."

cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'team-akhil',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/team-akhil',
      env: { NODE_ENV: 'production', PORT: 3000 },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'telegram-bot',
      script: 'node_modules/.bin/ts-node',
      args: 'scripts/telegram-bot.ts',
      cwd: '/var/www/team-akhil',
      env: { NODE_ENV: 'production', TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN', TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID' },
      instances: 1,
      autorestart: true,
      watch: false
    },
    {
      name: 'agent-worker',
      script: 'npm',
      args: 'run worker',
      cwd: '/var/www/team-akhil',
      env: { NODE_ENV: 'production' },
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
PM2EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo "  PM2 configured and running."

# ── DONE ────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  SETUP COMPLETE!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "NEXT STEPS:"
echo "1. Update .env with real credentials:"
echo "   - OPENROUTER_API_KEY"
echo "   - ANTHROPIC_AUTH_TOKEN"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - TELEGRAM_CHAT_ID"
echo "   - DATABASE_URL password"
echo "2. Update ~/.commandcode/auth.json with Command Code API key"
echo "3. Set up SSL: certbot --nginx -d YOUR_DOMAIN"
echo "4. Run database migrations: npm run db:migrate"
echo "5. Start Claude Code: cd /var/www/team-akhil && claude"
echo ""
echo "PM2 COMMANDS:"
echo "  pm2 list        — running processes"
echo "  pm2 logs       — view logs"
echo "  pm2 monit     — real-time monitoring"
echo "  pm2 restart all — restart everything"
echo ""
echo "TO START CLAUDE CODE:"
echo "  cd /var/www/team-akhil && claude"
echo ""
echo "TELEGRAM BOT:"
echo "  Send /start to your bot"
echo "  Send any task as message"
echo "  Bot executes via Claude Code"
echo "  Reports sent back to you"
