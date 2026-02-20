"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, MapPin, Star, Filter, Search, TrendingUp, Users, Calendar } from 'lucide-react';
//import { supabase } from '@/lib/supabase';
import { supabase } from "@/lib/supabaseClient";

export default function ExplorePage() {
  const router = useRouter();
  const [musicians, setMusicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const genres = ['All', 'Afrobeat', 'Jazz', 'Hip Hop', 'Gospel', 'Highlife', 'Reggae', 'Pop', 'R&B'];
  const locations = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];

  useEffect(() => {
    fetchMusicians();
  }, []);

  const fetchMusicians = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'MUSICIAN')
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      setMusicians(data || []);
    } catch (error) {
      console.error('Error fetching musicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMusicians = musicians.filter(musician => {
    const matchesGenre = selectedGenre === 'all' || 
      (musician.genres && musician.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase()));
    
    const matchesLocation = selectedLocation === 'all' || 
      musician.location?.toLowerCase().includes(selectedLocation.toLowerCase());
    
    const matchesSearch = !searchQuery || 
      musician.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      musician.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      musician.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGenre && matchesLocation && matchesSearch;
  });

  const handleMusicianClick = (musicianId) => {
    // Redirect to sign up with return URL
    router.push(`/auth/signup?returnTo=/musician/profile/${musicianId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Musicians
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              Discover Nigeria's top-rated musicians and DJs
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search musicians by name..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          
          {/* Genre Filter */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Genre
            </label>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre.toLowerCase())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedGenre === genre.toLowerCase()
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {locations.map((location) => (
                <option key={location} value={location.toLowerCase()}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{filteredMusicians.length}</span> musicians
          </p>
        </div>

        {/* Musicians Grid */}
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
        ) : filteredMusicians.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No musicians found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters
            </p>
            <button
              onClick={() => {
                setSelectedGenre('all');
                setSelectedLocation('all');
                setSearchQuery('');
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMusicians.map((musician) => (
              <div
                key={musician.id}
                onClick={() => handleMusicianClick(musician.id)}
                className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer border border-gray-200 dark:border-gray-700"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden">
                  {musician.avatar_url ? (
                    <img
                      src={musician.avatar_url}
                      alt={musician.display_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-16 h-16 text-white" />
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

                  {/* Location */}
                  {musician.location && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{musician.location}</span>
                    </div>
                  )}

                  {/* Genres */}
                  {musician.genres && musician.genres.length > 0 && (
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

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Perfect Musician?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Sign up now to unlock full profiles, instant booking, and secure payments
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