"use client";

import { useState } from "react";

export default function SearchFilterBar({ filters, setFilters }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const musicianRoles = [
    { value: "Singer", label: "🎤 Singer", emoji: "🎤" },
    { value: "Guitarist", label: "🎸 Guitarist", emoji: "🎸" },
    { value: "Drummer", label: "🥁 Drummer", emoji: "🥁" },
    { value: "DJ", label: "🎧 DJ", emoji: "🎧" },
    { value: "Keyboardist", label: "🎹 Keyboardist", emoji: "🎹" },
    { value: "Bassist", label: "🎸 Bassist", emoji: "🎸" },
    { value: "Saxophonist", label: "🎷 Saxophonist", emoji: "🎷" },
    { value: "Trumpeter", label: "🎺 Trumpeter", emoji: "🎺" },
    { value: "Violinist", label: "🎻 Violinist", emoji: "🎻" },
    { value: "MC/Host", label: "🎙️ MC/Host", emoji: "🎙️" },
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">🔍 Find Musicians</h3>
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                {activeFiltersCount} active
              </span>
              <button
                onClick={clearFilters}
                className="text-white hover:bg-white/20 px-3 py-1 rounded-lg text-sm transition"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Search */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Quick Search
          </label>
          <input
            type="text"
            placeholder="Search by name, instrument, or style..."
            value={filters.search || ""}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full px-4 py-3 border-2 text-white  border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring focus:ring-purple-200 dark:bg-gray-700 dark:text-white transition"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            📍 Location
          </label>
          <input
            type="text"
            placeholder="e.g., Lagos, Abuja, Port Harcourt..."
            value={filters.location || ""}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-4 py-3 border-2 text-white border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
          />
        </div>

        {/* Musician Role/Profession Filter */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            🎵 Musician Type
          </label>
          <div className="flex flex-wrap gap-2">
            {musicianRoles.map(role => (
              <button
                key={role.value}
                onClick={() => handleRoleToggle(role.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filters.roles?.includes(role.value)
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {role.emoji} {role.value}
              </button>
            ))}
          </div>
          {filters.roles?.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {filters.roles.length} role{filters.roles.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium"
        >
          <span>{showAdvanced ? '▼' : '▶'}</span>
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
        </button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                🎶 Music Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      filters.genres?.includes(genre)
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              {filters.genres?.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {filters.genres.length} genre{filters.genres.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Availability & Rating */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  📅 Availability
                </label>
                <select
                  value={filters.availability || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                >
                  <option value="">Any Status</option>
                  <option value="available">✅ Available</option>
                  <option value="busy">⏰ Busy</option>
                  <option value="unavailable">❌ Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  ⭐ Minimum Rating
                </label>
                <select
                  value={filters.rating || 0}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
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
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                💰 Hourly Rate Range (₦)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:bg-gray-700 dark:text-white transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold">
                Active Filters:
              </span>
              <div className="flex-1 flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs">
                    Search: &quot;{filters.search}&quot;
                  </span>
                )}
                {filters.location && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs">
                    📍 {filters.location}
                  </span>
                )}
                {filters.roles?.map(role => (
                  <span key={role} className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs">
                    🎵 {role}
                    <button
                      onClick={() => handleRoleToggle(role)}
                      className="hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.genres?.map(genre => (
                  <span key={genre} className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs">
                    🎶 {genre}
                    <button
                      onClick={() => handleGenreToggle(genre)}
                      className="hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.availability && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs">
                    📅 {filters.availability}
                  </span>
                )}
                {filters.rating > 0 && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-1 rounded text-xs">
                    ⭐ {filters.rating}★+
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

