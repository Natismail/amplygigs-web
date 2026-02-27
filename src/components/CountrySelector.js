// src/components/CountrySelector.js
"use client";

import { Globe } from "lucide-react";

export const COUNTRIES = [
  // Major African Countries
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', dialCode: '+234' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', dialCode: '+233' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', dialCode: '+254' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', dialCode: '+20' },
  
  // North America
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', dialCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', dialCode: '+1' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', dialCode: '+44' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', dialCode: '+33' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', dialCode: '+49' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', dialCode: '+34' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', dialCode: '+39' },
  
  // More African Countries
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', dialCode: '+255' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX', dialCode: '+256' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', dialCode: '+250' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB', dialCode: '+251' },
  
  // Caribbean
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', currency: 'JMD', dialCode: '+1876' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹', currency: 'TTD', dialCode: '+1868' },
  
  // Asia
  { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'AED', dialCode: '+971' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', dialCode: '+91' },
];

export default function CountrySelector({ 
  value, 
  onChange, 
  label = "Country/Location",
  showCurrency = true,
  className = "" 
}) {
  const selectedCountry = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  const handleChange = (countryCode) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    onChange(country);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Globe className="w-4 h-4" />
        {label}
      </label>
      
      <div className="relative">
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-4 py-3 pl-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base appearance-none"
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>
        
        {/* Flag icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
          {selectedCountry.flag}
        </div>

        {/* Dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Country info */}
      {showCurrency && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Currency: {selectedCountry.currency} • Dial: {selectedCountry.dialCode}
        </p>
      )}
    </div>
  );
}

// Helper function to get country by code
export function getCountryByCode(code) {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES[0];
}
