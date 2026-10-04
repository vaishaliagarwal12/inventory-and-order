import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

export const CurrencyPrice = ({ amount, overrideCurrency, className = '' }) => {
  const { formatPrice } = useCurrency();
  const formatted = formatPrice(amount, overrideCurrency);

  return <span className={className}>{formatted}</span>;
};
