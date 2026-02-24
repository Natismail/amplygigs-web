// app/explore/page.js - FINAL POLISHED VERSION
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, MapPin, Star, Search, Calendar, Users, Globe, Filter, X, TrendingUp, Clock } from 'lucide-react';
import { supabase } from "@/lib/supabaseClient";

export default function ExplorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('musicians'); // 'musicians' | 'events'
  const [musicians, setMusicians] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'recent' | 'rating'

  // Genre options
  const genres = ['All', 'Afrobeat', 'Jazz', 'Hip Hop', 'Gospel', 'Highlife', 'Reggae', 'Pop', 'R&B', 'Classical', 'Rock', 'Soul', 'Amapiano', 'Fuji', 'Juju'];

  // Country options with their states
  const countries = {
    'Nigeria': ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Kaduna', 'Calabar', 'Benin City', 'Warri', 'Owerri', 'Jos', 'Abeokuta'],
    'UK': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Edinburgh', 'Bristol', 'Cardiff', 'Newcastle', 'Sheffield'],
    'USA': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Miami', 'Atlanta', 'Boston'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
    'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema', 'Obuasi'],
    'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London'],
    'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi'],
  };

  const countryList = ['All', ...Object.keys(countries)];
  
  // ⭐ FIX: Dynamically get state list when country changes
  const stateList = selectedCountry !== 'all' && selectedCountry !== '' && countries[selectedCountry.charAt(0).toUpperCase() + selectedCountry.slice(1)]
    ? ['All', ...countries[selectedCountry.charAt(0).toUpperCase() + selectedCountry.slice(1)]]
    : ['All'];

  useEffect(() => {
    if (activeTab === 'musicians') {
      fetchMusicians();
    } else {
      fetchEvents();
    }
  }, [activeTab]);

  const fetchMusicians = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching musicians...');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'MUSICIAN')
        .eq('profile_visible', true) // Only show visible profiles
        .order('is_featured', { ascending: false }) // Featured first
        .order('average_rating', { ascending: false }) // Then by rating
        .order('created_at', { ascending: false }) // Then by recent
        .limit(100);

      if (error) throw error;

      console.log('✅ Fetched musicians:', data?.length || 0);
      setMusicians(data || []);
    } catch (error) {
      console.error('❌ Error fetching musicians:', error);
      setMusicians([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      console.log('🔍 Fetching events...');
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          creator:user_profiles!creator_id(
            id,
            first_name,
            last_name,
            display_name,
            profile_picture_url
          ),
          event_interests(id)
        `)
        .eq('status', 'open') // Only show open events
        // Keep commented for testing - you can uncomment later
        // .gte('event_date', new Date().toISOString()) // Future events only
        .order('created_at', { ascending: false }) // Most recent first
        .limit(10);

      if (error) throw error;

      console.log('✅ Fetched events:', data?.length || 0);
      
      const eventsWithCount = (data || []).map(event => ({
        ...event,
        interested_count: event.event_interests?.length || 0
      }));
      
      setEvents(eventsWithCount);
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // ⭐ ENHANCED: Apply sorting to musicians
  const getSortedMusicians = (musiciansList) => {
    const sorted = [...musiciansList];
    
    switch (sortBy) {
      case 'popular':
        return sorted.sort((a, b) => {
          // First by featured status
          if (a.is_featured !== b.is_featured) {
            return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
          }
          // Then by rating
          if ((b.average_rating || 0) !== (a.average_rating || 0)) {
            return (b.average_rating || 0) - (a.average_rating || 0);
          }
          // Then by total bookings
          return (b.total_bookings || 0) - (a.total_bookings || 0);
        });
      
      case 'recent':
        return sorted.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      
      case 'rating':
        return sorted.sort((a, b) => {
          if ((b.average_rating || 0) !== (a.average_rating || 0)) {
            return (b.average_rating || 0) - (a.average_rating || 0);
          }
          // Tie-breaker: more ratings = higher priority
          return (b.total_bookings || 0) - (a.total_bookings || 0);
        });
      
      default:
        return sorted;
    }
  };

  // Filter musicians
  const filteredMusicians = musicians.filter(musician => {
    // Genre filter - handle both array and string
    const musicianGenres = Array.isArray(musician.genres) 
      ? musician.genres 
      : (musician.genres ? [musician.genres] : []);
    
    const matchesGenre = selectedGenre === 'all' || 
      musicianGenres.some(g => g.toLowerCase() === selectedGenre.toLowerCase());
    
    // Country filter
    const matchesCountry = selectedCountry === 'all' || 
      musician.country?.toLowerCase() === selectedCountry.toLowerCase() ||
      musician.location?.toLowerCase().includes(selectedCountry.toLowerCase());
    
    // State/City filter - check multiple fields
    const matchesState = selectedState === 'all' || 
      musician.city?.toLowerCase() === selectedState.toLowerCase() ||
      musician.state?.toLowerCase() === selectedState.toLowerCase() ||
      musician.location?.toLowerCase().includes(selectedState.toLowerCase());
    
    // Search filter - expanded to include more fields
    const matchesSearch = !searchQuery || 
      musician.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      musician.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      musician.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      musician.primary_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      musician.professional_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      musician.bio?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGenre && matchesCountry && matchesState && matchesSearch;
  });

  // Apply sorting
  const sortedMusicians = getSortedMusicians(filteredMusicians);

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCountry = selectedCountry === 'all' || 
      event.country?.toLowerCase() === selectedCountry.toLowerCase();

    const matchesState = selectedState === 'all' || 
      event.city?.toLowerCase() === selectedState.toLowerCase() ||
      event.city?.toLowerCase().includes(selectedState.toLowerCase());

    return matchesSearch && matchesCountry && matchesState;
  });

  const handleMusicianClick = (musicianId) => {
    router.push(`/login?returnTo=/musician/${musicianId}`);
  };

  const handleEventClick = (eventId) => {
    router.push(`/login?returnTo=/event/${eventId}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedCountry('all');
    setSelectedState('all');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore {activeTab === 'musicians' ? 'Musicians' : 'Events'}
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              {activeTab === 'musicians' 
                ? 'Discover talented musicians from around the world'
                : 'Browse upcoming events and performances'
              }
            </p>
            
            {/* Tabs */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setActiveTab('musicians')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  activeTab === 'musicians'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Find Musicians
                </div>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  activeTab === 'events'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Find Events
                  {events.length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {events.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === 'musicians' ? 'Search musicians by name, role, or bio...' : 'Search events by title, venue, or location...'}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Filter Toggle Button (Mobile) */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold">
                {activeTab === 'musicians' ? sortedMusicians.length : filteredEvents.length}
              </span> {activeTab === 'musicians' ? 'musicians' : 'events'}
            </p>
            
            {/* Sort By (Musicians only) */}
            {activeTab === 'musicians' && sortedMusicians.length > 0 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="hidden sm:block px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Joined</option>
                <option value="rating">Highest Rated</option>
              </select>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filters */}
        <div className={`mb-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h3>
              <div className="flex items-center gap-2">
                {(selectedGenre !== 'all' || selectedCountry !== 'all' || selectedState !== 'all' || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    console.log('Country changed to:', e.target.value);
                    setSelectedCountry(e.target.value);
                    setSelectedState('all'); // Reset state when country changes
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  {countryList.map((country) => (
                    <option key={country} value={country.toLowerCase()}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* State/City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  State/City
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    console.log('State changed to:', e.target.value);
                    setSelectedState(e.target.value);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedCountry === 'all'}
                >
                  {stateList.map((state) => (
                    <option key={state} value={state.toLowerCase()}>
                      {state}
                    </option>
                  ))}
                </select>
                {selectedCountry === 'all' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select a country first
                  </p>
                )}
              </div>

              {/* Genre Filter (Musicians only) */}
              {activeTab === 'musicians' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Genre
                  </label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    {genres.map((genre) => (
                      <option key={genre} value={genre.toLowerCase()}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Genre Pills (Musicians only - visible on desktop) */}
            {activeTab === 'musicians' && (
              <div className="mt-4 hidden lg:block">
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 10).map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre.toLowerCase())}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedGenre === genre.toLowerCase()
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                  {genres.length > 10 && (
                    <span className="px-4 py-2 text-sm text-gray-500">
                      +{genres.length - 10} more...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MUSICIANS TAB */}
        {activeTab === 'musicians' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : sortedMusicians.length === 0 ? (
              <div className="text-center py-16">
                <Music className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No musicians found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {musicians.length === 0 
                    ? 'No musicians available yet. Check back soon!'
                    : 'Try adjusting your filters or search query'
                  }
                </p>
                {musicians.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMusicians.map((musician) => (
                  <div
                    key={musician.id}
                    onClick={() => handleMusicianClick(musician.id)}
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer border border-gray-200 dark:border-gray-700"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden">
                      {musician.profile_picture_url ? (
                        <img
                          src={musician.profile_picture_url}
                          alt={musician.display_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-16 h-16 text-white" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {musician.is_featured && (
                        <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          Featured
                        </div>
                      )}

                      {/* Verified Badge */}
                      {musician.is_verified && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          Verified
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 transition">
                        {musician.display_name || `${musician.first_name} ${musician.last_name}`}
                      </h3>

                      {/* Role */}
                      {(musician.professional_title || musician.primary_role) && (
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                          {musician.professional_title || musician.primary_role}
                        </p>
                      )}

                      {/* Location */}
                      {(musician.city || musician.country || musician.location) && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">
                            {musician.city && musician.country 
                              ? `${musician.city}, ${musician.country}`
                              : musician.location || musician.country
                            }
                          </span>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mb-3">
                        {/* Rating */}
                        {musician.average_rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {musician.average_rating.toFixed(1)}
                            </span>
                          </div>
                        )}

                        {/* Total Bookings */}
                        {musician.total_bookings > 0 && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs">
                              {musician.total_bookings} gigs
                            </span>
                          </div>
                        )}

                        {/* Member Since */}
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(musician.created_at).getFullYear()}
                        </div>
                      </div>

                      {/* Genres */}
                      {musician.genres && Array.isArray(musician.genres) && musician.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {musician.genres.slice(0, 3).map((genre, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium"
                            >
                              {genre}
                            </span>
                          ))}
                          {musician.genres.length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                              +{musician.genres.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bio */}
                      {musician.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {musician.bio}
                        </p>
                      )}

                      {/* CTA */}
                      <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition transform group-hover:scale-105">
                        View Profile & Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <>
            {eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No events found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {events.length === 0
                    ? 'No events available yet. Check back later!'
                    : 'Try adjusting your search or filters'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer border border-gray-200 dark:border-gray-700"
                  >
                    {/* ADDING EVENT IMAGE HERE */}
                    {event.flyer_url && (
                      <div className="relative w-full h-48 bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden">
                        <img
                          src={event.flyer_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                      </div>
                    )}

                    <div className="p-6">
                    
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 transition">
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {(event.venue || event.city) && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">
                            {event.venue && `${event.venue}, `}{event.city}{event.country && `, ${event.country}`}
                          </span>
                        </div>
                      )}

                      {event.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {event.description}
                        </p>
                      )}

                      {event.budget_range && (
                        <div className="mb-4">
                          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                            Budget: {event.budget_range}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">
                            {event.interested_count} interested
                          </span>
                        </div>
                      </div>

                      <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition transform group-hover:scale-105">
                        View Event Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {activeTab === 'musicians' 
              ? 'Ready to Book Your Perfect Musician?'
              : 'Want to List Your Event?'
            }
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            {activeTab === 'musicians'
              ? 'Sign up now to unlock full profiles, instant booking, and secure payments'
              : 'Join now to post events and connect with talented musicians'
            }
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl transition transform hover:scale-105"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  );
}