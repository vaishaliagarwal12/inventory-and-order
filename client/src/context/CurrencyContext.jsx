import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getExchangeRatesApi } from '../services/api';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_currency');
      return saved === 'INR' ? 'INR' : 'USD';
    } catch {
      return 'USD';
    }
  });

  const [rates, setRates] = useState({ USD: 1, INR: 83.50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getExchangeRatesApi();
      if (res.data?.rates) {
        setRates(res.data.rates);
      }
    } catch (err) {
      console.warn('Failed to load live exchange rates, using safe fallback rates:', err.message);
      setError('Unable to retrieve current exchange rate. Showing prices in USD or cached rates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setCurrency = (newCurrency) => {
    if (newCurrency !== 'USD' && newCurrency !== 'INR') return;
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem('nexus_currency', newCurrency);
    } catch (e) {
      console.error('Failed to save currency preference', e);
    }
  };

  const convertAmount = (usdAmount, targetCurrency = currency) => {
    const num = parseFloat(usdAmount);
    if (isNaN(num)) return 0;
    if (targetCurrency === 'INR') {
      const inrRate = rates.INR || 83.50;
      return num * inrRate;
    }
    return num;
  };

  const formatPrice = (usdAmount, overrideCurrency = currency) => {
    const num = parseFloat(usdAmount);
    if (isNaN(num)) return '$0.00';

    if (overrideCurrency === 'INR') {
      if (loading && !rates.INR) {
        return '₹ --';
      }
      const converted = convertAmount(num, 'INR');
      try {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        }).format(converted);
      } catch {
        return `₹${converted.toFixed(2)}`;
      }
    }

    // Default USD formatting
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(num);
    } catch {
      return `$${num.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        loading,
        error,
        convertAmount,
        formatPrice,
        refreshRates: fetchRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
