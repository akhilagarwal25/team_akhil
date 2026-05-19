/**
 * NIVESH - Stock Analyst Integration with SmartAPI (Angel One)
 *
 * Provides live NSE/BSE data for swing trade analysis
 */

import * as https from 'https';

// SmartAPI Configuration
const SMARTAPI_BASE = 'https://apiconnect.angelone.in';
const API_KEY = process.env.SMARTAPI_API_KEY || '';
const CLIENT_ID = process.env.SMARTAPI_USERNAME || '';
const PIN = process.env.SMARTAPI_PIN || '';
const TOTP_SECRET = process.env.SMARTAPI_TOTP_SECRET || '';

interface SmartAPIConfig {
  apiKey: string;
  clientId: string;
  password: string;
  totpSecret: string;
}

interface TokenData {
  jwtToken: string;
  refreshToken: string;
  feedToken: string;
  expiresAt: number;
}

let cachedToken: TokenData | null = null;

// Generate TOTP code
function generateTOTP(secret: string): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30);

  // Simplified TOTP - in production use a proper TOTP library
  // For now, we'll use the SmartAPI Python library via subprocess
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// HTTP Request helper
async function httpRequest(
  method: string,
  path: string,
  body?: object,
  headers?: Record<string, string>
): Promise<any> {
  return new Promise((resolve, reject) => {
    const options: any = {
      hostname: 'apiconnect.angelone.in',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-ApiKey': API_KEY,
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Generate session with SmartAPI
async function generateSession(): Promise<TokenData> {
  const totp = generateTOTP(TOTP_SECRET);

  const response = await httpRequest(
    'POST',
    '/rest/auth/angelone/api/login',
    {
      email: `${CLIENT_ID}@angelone.in`,
      password: PIN,
      api_key: API_KEY,
    }
  );

  if (response.status) {
    cachedToken = {
      jwtToken: response.data.jwtToken,
      refreshToken: response.data.refreshToken,
      feedToken: response.data.feedToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    return cachedToken;
  }

  throw new Error(response.message || 'Failed to generate session');
}

// Get valid token
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.jwtToken;
  }
  const session = await generateSession();
  return session.jwtToken;
}

// ================================================================
// NIVESH PUBLIC API
// ================================================================

/**
 * Get LTP (Last Traded Price) for a symbol
 * @param symbol - NSE symbol (e.g., 'RELIANCE', 'TATACONSUMP')
 */
export async function getLTP(symbol: string): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}> {
  const token = await getToken();

  const response = await httpRequest(
    'GET',
    `/rest/auth/angelone/api/v1/ltp/${symbol}/NSE`,
    undefined,
    { Authorization: `Bearer ${token}` }
  );

  if (response.status) {
    const data = response.data;
    return {
      symbol,
      price: data.ltp,
      change: data.change,
      changePercent: data.pChange,
      volume: data.volume || 0,
    };
  }

  throw new Error(response.message || 'Failed to get LTP');
}

/**
 * Get OHLC data for a symbol
 * @param symbol - NSE symbol
 * @param exchange - 'NSE' or 'BSE'
 */
export async function getOHLC(symbol: string, exchange: string = 'NSE'): Promise<{
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}> {
  const token = await getToken();

  const response = await httpRequest(
    'GET',
    `/rest/auth/angelone/api/v1/ohlc/${symbol}/${exchange}`,
    undefined,
    { Authorization: `Bearer ${token}` }
  );

  if (response.status) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get OHLC');
}

/**
 * Get historical candle data for technical analysis
 * @param symbol - NSE symbol
 * @param exchange - 'NSE' or 'BSE'
 * @param interval - 'ONE_MINUTE', 'FIVE_MINUTE', 'FIFTEEN_MINUTE', 'ONE_HOUR', 'ONE_DAY'
 * @param fromDate - Start date (YYYY-MM-DD HH:MM)
 * @param toDate - End date (YYYY-MM-DD HH:MM)
 */
export async function getCandleData(
  symbol: string,
  exchange: string = 'NSE',
  interval: string = 'ONE_DAY',
  fromDate: string,
  toDate: string
): Promise<{
  symbol: string;
  candles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}> {
  const token = await getToken();

  const response = await httpRequest(
    'GET',
    `/rest/auth/angelone/api/v1/candle`,
    undefined,
    {
      Authorization: `Bearer ${token}`,
      exchange,
      symbol,
      interval,
      fromdate: fromDate,
      todate: toDate,
    }
  );

  if (response.status) {
    return {
      symbol,
      candles: response.data.candles.map((c: any) => ({
        timestamp: new Date(c[0]).getTime(),
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
      })),
    };
  }

  throw new Error(response.message || 'Failed to get candle data');
}

/**
 * Get market depth / order book
 */
export async function getMarketDepth(symbol: string): Promise<{
  buyQuantity: number;
  sellQuantity: number;
  bid: Array<{ price: number; quantity: number }>;
  ask: Array<{ price: number; quantity: number }>;
}> {
  const token = await getToken();

  const response = await httpRequest(
    'GET',
    `/rest/auth/angelone/api/v1/marketDepth/${symbol}/NSE`,
    undefined,
    { Authorization: `Bearer ${token}` }
  );

  if (response.status) {
    return response.data;
  }

  throw new Error(response.message || 'Failed to get market depth');
}

/**
 * Search for symbols
 */
export async function searchSymbol(query: string): Promise<Array<{
  symbol: string;
  exchange: string;
  name: string;
  token: string;
}>> {
  const token = await getToken();

  const response = await httpRequest(
    'GET',
    `/rest/auth/angelone/api/v1/search/${query}`,
    undefined,
    { Authorization: `Bearer ${token}` }
  );

  if (response.status) {
    return response.data;
  }

  return [];
}

// ================================================================
// TECHNICAL INDICATORS (calculated from candle data)
// ================================================================

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(candles: number[], period: number = 14): number {
  if (candles.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i] - candles[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(candles: number[], period: number): number {
  if (candles.length < period) return candles[candles.length - 1];

  const sum = candles.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate Support and Resistance levels
 */
export function calculateSupportResistance(candles: { high: number; low: number }[]): {
  support: number;
  resistance: number;
  pivot: number;
} {
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const closes = candles.map((c) => c.close);

  const lastClose = closes[closes.length - 1];

  // Simple pivot calculation
  const pivot = (highs[highs.length - 1] + lows[lows.length - 1] + lastClose) / 3;
  const support = 2 * pivot - highs[highs.length - 1];
  const resistance = 2 * pivot - lows[lows.length - 1];

  return { support, resistance, pivot };
}

/**
 * Analyze stock with multiple indicators
 */
export async function analyzeStock(symbol: string): Promise<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  rsi: number;
  sma20: number;
  sma50: number;
  support: number;
  resistance: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
}> {
  try {
    // Get current price
    const ltp = await getLTP(symbol);

    // Get 50 days of historical data for analysis
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const candles = await getCandleData(symbol, 'NSE', 'ONE_DAY', fromDate, toDate);

    const closes = candles.candles.map((c) => c.close);
    const highs = candles.candles.map((c) => c.high);
    const lows = candles.candles.map((c) => c.low);

    // Calculate indicators
    const rsi = calculateRSI(closes, 14);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const { support, resistance } = calculateSupportResistance(
      candles.candles.slice(-20).map((c) => ({ high: c.high, low: c.low }))
    );

    // Generate recommendation
    let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;

    if (rsi < 30 && ltp.price < sma20) {
      recommendation = 'BUY';
      confidence = Math.min(90, 70 + (30 - rsi));
    } else if (rsi > 70 && ltp.price > sma20) {
      recommendation = 'SELL';
      confidence = Math.min(90, 70 + (rsi - 70));
    } else if (ltp.price > sma20 && sma20 > sma50) {
      recommendation = 'BUY';
      confidence = 60;
    } else if (ltp.price < sma20 && sma20 < sma50) {
      recommendation = 'SELL';
      confidence = 60;
    }

    return {
      symbol,
      price: ltp.price,
      change: ltp.change,
      changePercent: ltp.changePercent,
      rsi,
      sma20,
      sma50,
      support,
      resistance,
      recommendation,
      confidence,
    };
  } catch (error) {
    console.error(`Failed to analyze ${symbol}:`, error);
    throw error;
  }
}

// ================================================================
// SWING TRADE RECOMMENDATION FORMAT
// ================================================================

export interface SwingTradeRecommendation {
  symbol: string;
  currentPrice: number;
  entryRange: { min: number; max: number };
  target: number;
  stopLoss: number;
  riskReward: number;
  timeframe: string;
  confidence: number;
  technicalSummary: string;
  fundamentalSummary: string;
}

export async function generateSwingTrade(
  symbol: string,
  horizonDays: number = 10
): Promise<SwingTradeRecommendation> {
  const analysis = await analyzeStock(symbol);

  const riskPercent = 0.05; // 5% risk
  const targetPercent = 0.10; // 10% target

  const stopLoss = analysis.price * (1 - riskPercent);
  const target = analysis.price * (1 + targetPercent);
  const riskReward = targetPercent / riskPercent;

  const timeframe =
    horizonDays <= 5
      ? '5 days (short-term)'
      : horizonDays <= 15
      ? '10 days (swing)'
      : '15 days (swing)';

  let technicalSummary = '';
  if (analysis.rsi < 30) technicalSummary += 'RSI oversold. ';
  if (analysis.rsi > 70) technicalSummary += 'RSI overbought. ';
  if (analysis.price > analysis.sma20) technicalSummary += 'Above 20-day MA. ';
  if (analysis.price < analysis.sma20) technicalSummary += 'Below 20-day MA. ';
  technicalSummary += `Support: ₹${analysis.support.toFixed(2)}. Resistance: ₹${analysis.resistance.toFixed(2)}.`;

  return {
    symbol,
    currentPrice: analysis.price,
    entryRange: {
      min: analysis.price,
      max: analysis.price * 1.005,
    },
    target,
    stopLoss,
    riskReward,
    timeframe,
    confidence: analysis.confidence,
    technicalSummary,
    fundamentalSummary: 'Fundamental analysis pending.',
  };
}
