// src/components/SearchFilterBar.js - IMPROVED VERSION
"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal, MapPin, Star, DollarSign } from "lucide-react";

export default function SearchFilterBar({ filters, setFilters, resultsCount }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const musicianRoles = [
    { value: "Singer", label: "Singer", emoji: "🎤" },
    { value: "Guitarist", label: "Guitarist", emoji: "🎸" },
    { value: "Drummer", label: "Drummer", emoji: "🥁" },
    { value: "DJ", label: "DJ", emoji: "🎧" },
    { value: "Keyboardist", label: "Keyboardist", emoji: "🎹" },
    { value: "Bassist", label: "Bassist", emoji: "🎸" },
    { value: "Saxophonist", label: "Saxophonist", emoji: "🎷" },
    { value: "Trumpeter", label: "Trumpeter", emoji: "🎺" },
    { value: "Violinist", label: "Violinist", emoji: "🎻" },
    { value: "MC/Host", label: "MC/Host", emoji: "🎙️" },
  ];

  const genres = [
    "Afrobeats", "Hip Hop", "R&B", "Jazz", "Gospel",
    "Highlife", "Reggae", "Pop", "Rock", "Classical", "Electronic"
  ];

  const handleRoleToggle = (role) => {
    const currentRoles = filters.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setFilters(prev => ({ ...prev, roles: newRoles }));
  };

  const handleGenreToggle = (genre) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    
    setFilters(prev => ({ ...prev, genres: newGenres }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      location: "",
      roles: [],
      genres: [],
      availability: "",
      rating: 0,
      priceMin: "",
      priceMax: "",
    });
  };

  const activeFiltersCount = 
    (filters.search?.length > 0 ? 1 : 0) +
    (filters.location?.length > 0 ? 1 : 0) +
    (filters.roles?.length || 0) +
    (filters.genres?.length || 0) +
    (filters.availability ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0) +
    (filters.priceMin || filters.priceMax ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Compact Header - Always Visible */}
      <div className="p-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search musicians by name or instrument..."
            value={filters.search || ""}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Quick Filters & Toggle Button */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* Location Quick Filter */}
          <div className="relative flex-1 min-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Location..."
              value={filters.location || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isExpanded || activeFiltersCount > 0
                ? "bg-purple-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear All Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition"
            >
              Clear All
            </button>
          )}

          {/* Results Count */}
          {resultsCount !== undefined && (
            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400 font-medium">
              {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 animate-fadeIn">
          {/* Musician Roles */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Musician Type
            </label>
            <div className="flex flex-wrap gap-2">
              {musicianRoles.map(role => (
                <button
                  key={role.value}
                  onClick={() => handleRoleToggle(role.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.roles?.includes(role.value)
                      ? 'bg-purple-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-1">{role.emoji}</span>
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium text-sm"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            <span>{showAdvanced ? 'Hide' : 'Show'} More Filters</span>
          </button>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Genres */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Music Genres
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.genres?.includes(genre)
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability & Rating */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Availability
                  </label>
                  <select
                    value={filters.availability || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Any Status</option>
                    <option value="available">✅ Available</option>
                    <option value="busy">⏰ Busy</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block-1 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating || 0}
                    onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3★ and above</option>
                    <option value={4}>4★ and above</option>
                    <option value={5}>5★ only</option>
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block-1 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Hourly Rate Range (₦)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                    className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                    className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary - Compact */}
      {activeFiltersCount > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-800 px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-purple-700 dark:text-purple-300 font-semibold">
              Active:
            </span>
            {filters.roles?.slice(0, 2).map(role => (
              <span key={role} className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full">
                {role}
                <button onClick={() => handleRoleToggle(role)} className="hover:text-purple-900">×</button>
              </span>
            ))}
            {filters.roles?.length > 2 && (
              <span className="text-purple-600 dark:text-purple-400">
                +{filters.roles.length - 2} more
              </span>
            )}
            {filters.genres?.slice(0, 2).map(genre => (
              <span key={genre} className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full">
                {genre}
                <button onClick={() => handleGenreToggle(genre)} className="hover:text-purple-900">×</button>
              </span>
            ))}
            {filters.genres?.length > 2 && (
              <span className="text-purple-600 dark:text-purple-400">
                +{filters.genres.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}