// src/components/CurrencySelector.js
"use client";

import { DollarSign, Globe } from "lucide-react";

export const CURRENCIES = [
  {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: '🇳🇬',
    paymentProvider: 'paystack'
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    paymentProvider: 'stripe'
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    paymentProvider: 'stripe'
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    country: 'Europe',
    countryCode: 'EU',
    flag: '🇪🇺',
    paymentProvider: 'stripe'
  },
  {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghanaian Cedi',
    country: 'Ghana',
    countryCode: 'GH',
    flag: '🇬🇭',
    paymentProvider: 'paystack'
  },
  {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    country: 'Kenya',
    countryCode: 'KE',
    flag: '🇰🇪',
    paymentProvider: 'paystack'
  },
  {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    country: 'South Africa',
    countryCode: 'ZA',
    flag: '🇿🇦',
    paymentProvider: 'paystack'
  }
];

export default function CurrencySelector({ 
  value, 
  onChange, 
  label = "Currency",
  showPaymentProvider = false,
  className = "" 
}) {
  const selectedCurrency = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

  return (
    <div className={className}>
      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        {label}
      </label>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            const currency = CURRENCIES.find(c => c.code === e.target.value);
            onChange(currency);
          }}
          className="w-full px-4 py-3 pl-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base appearance-none"
        >
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.flag} {currency.name} ({currency.symbol})
            </option>
          ))}
        </select>
        
        {/* Currency symbol icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
          {selectedCurrency.flag}
        </div>

        {/* Dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Payment provider info */}
      {showPaymentProvider && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Globe className="w-3.5 h-3.5" />
          <span>
            Payments via{" "}
            <span className="font-semibold capitalize">
              {selectedCurrency.paymentProvider}
            </span>
          </span>
        </div>
      )}

      {/* Currency info */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Selected: {selectedCurrency.symbol} {selectedCurrency.code} ({selectedCurrency.country})
      </p>
    </div>
  );
}

// Helper function to get currency by code
export function getCurrencyByCode(code) {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

// Helper function to format amount with currency
export function formatCurrency(amount, currencyCode = 'NGN') {
  const currency = getCurrencyByCode(currencyCode);
  return `${currency.symbol}${amount.toLocaleString()}`;
}