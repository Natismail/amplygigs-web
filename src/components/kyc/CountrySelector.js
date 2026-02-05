// src/components/kyc/CountrySelector.js
"use client";

import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

const POPULAR_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', popular: true },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', popular: true },
  { code: 'US', name: 'United States', flag: '🇺🇸', popular: true },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', popular: true },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', popular: true },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', popular: true },
];

const ALL_COUNTRIES = [
  ...POPULAR_COUNTRIES,
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function CountrySelector({ onSelectCountry }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredCountries = searchTerm
    ? ALL_COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : showAll
    ? ALL_COUNTRIES
    : POPULAR_COUNTRIES;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select Your Country of Residence
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the country where you currently live and work
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for your country..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Popular Countries */}
      {!searchTerm && !showAll && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Popular Countries
          </h3>
        </div>
      )}

      {/* Country Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {filteredCountries.map((country) => (
          <button
            key={country.code}
            onClick={() => onSelectCountry(country.name)}
            className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group text-left"
          >
            <span className="text-3xl">{country.flag}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                {country.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {country.code}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Show All Countries Button */}
      {!searchTerm && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl font-medium transition"
        >
          Show All Countries →
        </button>
      )}

      {/* No Results */}
      {searchTerm && filteredCountries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No countries found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}