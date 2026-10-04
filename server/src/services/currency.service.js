/**
 * Service for fetching and caching exchange rates.
 * Base currency is USD.
 */

let cachedRates = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache TTL

export const getExchangeRates = async () => {
  const now = Date.now();

  // Return cached rates if fresh
  if (cachedRates && now - lastFetchTime < CACHE_TTL_MS) {
    return {
      ...cachedRates,
      cached: true,
    };
  }

  try {
    // Primary exchange rate API (free, reliable, no API key required)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`Primary rate provider returned status ${response.status}`);
    }

    const data = await response.json();
    const inrRate = data.rates?.INR;

    if (!inrRate || typeof inrRate !== 'number') {
      throw new Error('Invalid INR exchange rate returned from provider');
    }

    cachedRates = {
      base: 'USD',
      rates: {
        USD: 1,
        INR: parseFloat(inrRate.toFixed(2)),
      },
      updatedAt: data.time_last_update_utc || new Date().toISOString(),
    };
    lastFetchTime = now;

    return {
      ...cachedRates,
      cached: false,
    };
  } catch (primaryError) {
    console.warn('Primary exchange rate API failed, trying fallback provider:', primaryError.message);

    try {
      // Secondary fallback provider
      const fallbackResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback rate provider returned status ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      const inrRate = fallbackData.rates?.INR;

      if (!inrRate || typeof inrRate !== 'number') {
        throw new Error('Invalid INR rate from fallback provider');
      }

      cachedRates = {
        base: 'USD',
        rates: {
          USD: 1,
          INR: parseFloat(inrRate.toFixed(2)),
        },
        updatedAt: new Date().toISOString(),
      };
      lastFetchTime = now;

      return {
        ...cachedRates,
        cached: false,
      };
    } catch (fallbackError) {
      console.error('All exchange rate providers failed:', fallbackError.message);

      // If we have stale cached rates, use them
      if (cachedRates) {
        return {
          ...cachedRates,
          stale: true,
          cached: true,
        };
      }

      // If offline or provider blocked, return default structure with error flag
      throw new Error('Unable to retrieve current exchange rates from API services.');
    }
  }
};
