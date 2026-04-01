// src/components/SearchFilterBar.js
"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal, MapPin, Star, DollarSign } from "lucide-react";
import { getAllCategories, getSubcategories } from "@/lib/constants/musicianCategories";

export default function SearchFilterBar({ filters, setFilters, resultsCount }) {
  const [isExpanded, setIsExpanded]     = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Dynamic from your MUSICIAN_CATEGORIES constant ─────────────────────────
  const allCategories = getAllCategories(); // ["Singer", "Instrumentalist", "DJ", ...]

  // ── Genres from your actual DB/profile genres list ──────────────────────────
  const genres = [
    "Afrobeats", "Afro Pop", "Afro Fusion", "Highlife", "Fuji", "Juju",
    "Apala", "Afro Soul", "Afro Jazz", "Amapiano", "Hip Hop", "Trap",
    "R&B", "Neo Soul", "Pop", "Dancehall", "Reggae", "Rock", "Jazz",
    "Blues", "Classical", "Gospel", "Soul", "Electronic", "House",
    "Techno", "Funk", "Latin", "Instrumental",
  ];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCategoryToggle = (category) => {
    const current = filters.categories || [];
    setFilters(prev => ({
      ...prev,
      categories: current.includes(category)
        ? current.filter(c => c !== category)
        : [...current, category],
      // Reset subcategories when categories change
      subcategories: [],
    }));
  };

  const handleSubcategoryToggle = (sub) => {
    const current = filters.subcategories || [];
    setFilters(prev => ({
      ...prev,
      subcategories: current.includes(sub)
        ? current.filter(s => s !== sub)
        : [...current, sub],
    }));
  };

  const handleGenreToggle = (genre) => {
    const current = filters.genres || [];
    setFilters(prev => ({
      ...prev,
      genres: current.includes(genre)
        ? current.filter(g => g !== genre)
        : [...current, genre],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search:       "",
      location:     "",
      categories:   [],
      subcategories:[],
      genres:       [],
      availability: "",
      rating:       0,
      priceMin:     "",
      priceMax:     "",
      verifiedOnly: false,
    });
  };

  // ── Get subcategories for all selected categories combined ──────────────────
  const availableSubcategories = (filters.categories || []).reduce((acc, cat) => {
    const subs = getSubcategories(cat);
    return [...new Set([...acc, ...subs])];
  }, []);

  // ── Active filter count ─────────────────────────────────────────────────────
  const activeFiltersCount =
    (filters.search?.length      > 0 ? 1 : 0) +
    (filters.location?.length    > 0 ? 1 : 0) +
    (filters.categories?.length  || 0) +
    (filters.subcategories?.length || 0) +
    (filters.genres?.length      || 0) +
    (filters.availability         ? 1 : 0) +
    (filters.rating              > 0 ? 1 : 0) +
    (filters.priceMin || filters.priceMax ? 1 : 0) +
    (filters.verifiedOnly         ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* ── Always visible header ─────────────────────────────────────────── */}
      <div className="p-4">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, skill, instrument, or bio..."
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

        {/* Quick row — location + verified + filter toggle */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">

          {/* Location */}
          <div className="relative flex-1 min-w-[180px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="City or country..."
              value={filters.location || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* KYC Verified toggle */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
              filters.verifiedOnly
                ? "bg-green-600 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            ✅ KYC Verified
          </button>

          {/* Expand filters */}
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

          {/* Clear all */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition"
            >
              Clear All
            </button>
          )}

          {/* Results count */}
          {resultsCount !== undefined && (
            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400 font-medium">
              {resultsCount} {resultsCount === 1 ? "result" : "results"}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded filters ──────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-6">

          {/* ── Category (primary_role) ──────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              Musician Type
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.categories?.includes(cat)
                      ? "bg-purple-600 text-white shadow-md scale-105"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Subcategories — only show when categories are selected ──── */}
          {availableSubcategories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Specific Skills / Instruments
                <span className="ml-2 text-xs font-normal text-gray-400">
                  (from selected type{filters.categories?.length > 1 ? "s" : ""})
                </span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {availableSubcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => handleSubcategoryToggle(sub)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.subcategories?.includes(sub)
                        ? "bg-purple-500 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Advanced toggle ──────────────────────────────────────────── */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition font-medium text-sm"
          >
            <span>{showAdvanced ? "▼" : "▶"}</span>
            <span>{showAdvanced ? "Hide" : "Show"} More Filters</span>
          </button>

          {/* ── Advanced filters ─────────────────────────────────────────── */}
          {showAdvanced && (
            <div className="space-y-5 pt-4 border-t border-gray-200 dark:border-gray-700">

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
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability + Rating */}
              <div className="grid sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
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

              {/* Price range */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Hourly Rate Range
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

      {/* ── Active filters summary bar ────────────────────────────────────── */}
      {activeFiltersCount > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-800 px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-purple-700 dark:text-purple-300 font-semibold">
              Active:
            </span>

            {/* Category pills */}
            {filters.categories?.slice(0, 2).map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-2 py-0.5 rounded-full">
                {cat}
                <button onClick={() => handleCategoryToggle(cat)} className="hover:text-purple-900">×</button>
              </span>
            ))}
            {filters.categories?.length > 2 && (
              <span className="text-purple-600 dark:text-purple-400">
                +{filters.categories.length - 2} types
              </span>
            )}

            {/* Subcategory pills */}
            {filters.subcategories?.slice(0, 2).map(sub => (
              <span key={sub} className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-full">
                {sub}
                <button onClick={() => handleSubcategoryToggle(sub)} className="hover:text-indigo-900">×</button>
              </span>
            ))}
            {filters.subcategories?.length > 2 && (
              <span className="text-indigo-600 dark:text-indigo-400">
                +{filters.subcategories.length - 2} skills
              </span>
            )}

            {/* Genre pills */}
            {filters.genres?.slice(0, 2).map(genre => (
              <span key={genre} className="inline-flex items-center gap-1 bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-200 px-2 py-0.5 rounded-full">
                {genre}
                <button onClick={() => handleGenreToggle(genre)} className="hover:text-pink-900">×</button>
              </span>
            ))}
            {filters.genres?.length > 2 && (
              <span className="text-pink-600 dark:text-pink-400">
                +{filters.genres.length - 2} genres
              </span>
            )}

            {/* Verified badge */}
            {filters.verifiedOnly && (
              <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 py-0.5 rounded-full">
                ✅ KYC Verified
                <button onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: false }))} className="hover:text-green-900">×</button>
              </span>
            )}

            {/* Rating */}
            {filters.rating > 0 && (
              <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                {filters.rating}★+
                <button onClick={() => setFilters(prev => ({ ...prev, rating: 0 }))} className="hover:text-yellow-900">×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}