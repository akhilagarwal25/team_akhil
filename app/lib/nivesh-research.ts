/**
 * NIVESH Research Module - Stock Research using Perplexity via OpenRouter
 *
 * Uses Perplexity Sonar for real-time stock research, news, and sentiment
 */

import { generateText } from './openrouter';

export interface StockResearch {
  symbol: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  sentimentScore: number; // -100 to +100
  news: Array<{
    title: string;
    source: string;
    date: string;
    sentiment: string;
  }>;
  fundamentals: {
    pe: string;
    marketCap: string;
    industry: string;
    recentQuarterly: string;
  };
  analystView: string;
  risks: string[];
  opportunities: string[];
  summary: string;
}

/**
 * Research a stock using Perplexity Sonar
 */
export async function researchStock(symbol: string): Promise<StockResearch> {
  const prompt = `Research ${symbol} stock for swing trading (5-15 days).

Provide:
1. Current sentiment (POSITIVE/NEUTRAL/NEGATIVE) with score -100 to +100
2. Latest 5 news items with source and date
3. Key fundamentals (PE, market cap, industry)
4. Recent quarterly performance
5. Analyst view
6. Risks (3 max)
7. Opportunities (3 max)
8. 2-3 sentence summary for trading decision

Format response as JSON with this structure:
{
  "sentiment": "POSITIVE/NEGATIVE/NEUTRAL",
  "sentimentScore": number,
  "news": [{"title": "", "source": "", "date": "", "sentiment": ""}],
  "fundamentals": {"pe": "", "marketCap": "", "industry": "", "recentQuarterly": ""},
  "analystView": "",
  "risks": [],
  "opportunities": [],
  "summary": ""
}

Be concise and factual. Focus on trading-relevant information.`;

  try {
    const response = await generateText(prompt, {
      model: 'perplexity/sonar',
      temperature: 0.3,
      maxTokens: 2048,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        symbol,
        ...data,
      };
    }

    // Fallback if no JSON found
    return {
      symbol,
      sentiment: 'NEUTRAL' as const,
      sentimentScore: 0,
      news: [],
      fundamentals: {
        pe: 'N/A',
        marketCap: 'N/A',
        industry: 'N/A',
        recentQuarterly: 'N/A',
      },
      analystView: response.substring(0, 500),
      risks: [],
      opportunities: [],
      summary: response.substring(0, 500),
    };
  } catch (error) {
    console.error(`Research failed for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get news sentiment for a stock
 */
export async function getNewsSentiment(symbol: string): Promise<{
  overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  score: number;
  headlines: Array<{ text: string; sentiment: string }>;
}> {
  const prompt = `Get recent news sentiment for ${symbol} stock.

Return JSON:
{
  "overall": "POSITIVE/NEGATIVE/NEUTRAL",
  "score": number (-100 to +100),
  "headlines": [{"text": "news headline", "sentiment": "POSITIVE/NEGATIVE/NEUTRAL"}]
}

List 5 latest news items with sentiment classification.`;

  try {
    const response = await generateText(prompt, {
      model: 'perplexity/sonar',
      temperature: 0.2,
      maxTokens: 1024,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      overall: 'NEUTRAL' as const,
      score: 0,
      headlines: [],
    };
  } catch (error) {
    console.error(`News sentiment failed for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Get trading recommendation based on technical + fundamental
 */
export async function getTradingInsight(
  symbol: string,
  technicalData: {
    rsi: number;
    price: number;
    sma20: number;
    support: number;
    resistance: number;
  }
): Promise<{
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryRange: { min: number; max: number };
  target: number;
  stopLoss: number;
  reasoning: string;
}> {
  const prompt = `Stock: ${symbol}
Technical Analysis:
- RSI: ${technicalData.rsi.toFixed(1)}
- Price: ₹${technicalData.price}
- 20-day SMA: ₹${technicalData.sma20}
- Support: ₹${technicalData.support}
- Resistance: ₹${technicalData.resistance}

Based on this technical data, provide a swing trading recommendation (5-15 days).

Return JSON:
{
  "recommendation": "BUY/SELL/HOLD",
  "confidence": number (0-100),
  "entryRange": {"min": number, "max": number},
  "target": number,
  "stopLoss": number,
  "reasoning": "2-3 sentences explaining the decision"
}

Consider:
- RSI below 30 = oversold (potential BUY)
- RSI above 70 = overbought (potential SELL)
- Price above SMA = bullish, below = bearish
- Support/resistance for entry/exit points`;

  try {
    const response = await generateText(prompt, {
      model: 'perplexity/sonar-reasoning',
      temperature: 0.3,
      maxTokens: 1024,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      recommendation: 'HOLD' as const,
      confidence: 50,
      entryRange: { min: technicalData.price, max: technicalData.price * 1.01 },
      target: technicalData.price * 1.05,
      stopLoss: technicalData.price * 0.97,
      reasoning: response.substring(0, 300),
    };
  } catch (error) {
    console.error(`Trading insight failed for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Compare multiple stocks for swing trading
 */
export async function compareStocks(symbols: string[]): Promise<
  Array<{
    symbol: string;
    score: number;
    recommendation: 'BUY' | 'SELL' | 'HOLD';
    keyReason: string;
  }>
> {
  const prompt = `Compare these stocks for swing trading (5-15 days): ${symbols.join(', ')}

For each stock, assess swing trading potential based on recent momentum and news.

Return JSON array:
[
  {
    "symbol": "STOCK1",
    "score": number (-100 to +100),
    "recommendation": "BUY/SELL/HOLD",
    "keyReason": "One sentence why"
  }
]

Rank by swing trading potential. Be concise.`;

  try {
    const response = await generateText(prompt, {
      model: 'perplexity/sonar',
      temperature: 0.3,
      maxTokens: 1024,
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return symbols.map((s) => ({
      symbol: s,
      score: 0,
      recommendation: 'HOLD' as const,
      keyReason: 'Unable to analyze',
    }));
  } catch (error) {
    console.error(`Stock comparison failed:`, error);
    throw error;
  }
}
