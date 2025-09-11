// src/app/musician/dashboard/page.js
// "use client";
// import Layout from "@/components/Layout";
// import MusicianEvents from "@/components/MusicianEvents";

// export default function MusicianDashboard() {
//   return (
//     <Layout>
//       <h1 className="text-2xl font-bold mb-4 dark:text-white">My Dashboard</h1>
//       <p className="text-gray-700 dark:text-gray-300 mb-6">
//         Welcome back! Check your upcoming gigs, earnings, and AmplyGigs events.
//       </p>
//       <MusicianEvents />
//     </Layout>
//   );
// }




'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import Layout from "@/components/Layout";
import MusicianEvents from "@/components/MusicianEvents";


export default function MusicianDashboard() {
  const { user, loading } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [filters, setFilters] = useState({ date: 'newest', location: '', price: '' });

  useEffect(() => {
    if (user) {
      fetchGigs();
    }
  }, [user, filters]);

  const fetchGigs = async () => {
    let query = supabase.from('bookings').select('*, client:client_id(*)').eq('musician_id', user.id);

    // Apply filters
    if (filters.date === 'newest') {
      query = query.order('created_at', { ascending: false });
    }
    if (filters.location) {
      query = query.ilike('event_location', `%${filters.location}%`);
    }
    if (filters.price) {
      const [min, max] = filters.price.split('-');
      query = query.gte('offered_price', min).lte('offered_price', max);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching gigs:', error.message);
      return;
    }
    setGigs(data);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
    <div>
      <h1 className="text-2xl font-bold mb-4 dark:text-white">My Dashboard</h1>
       <p className="text-gray-700 dark:text-gray-300 mb-6">
         Welcome back! Check your upcoming gigs, earnings, and AmplyGigs events.
       </p>
      <h1>My Gigs</h1>
      <div>
        <label htmlFor="location-filter">Filter by Location:</label>
        <input
          id="location-filter"
          name="location"
          value={filters.location}
          onChange={handleFilterChange}
          placeholder="e.g. Lagos"
        />
      </div>
      <div>
        <label htmlFor="date-filter">Sort by Date:</label>
        <select id="date-filter" name="date" value={filters.date} onChange={handleFilterChange}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
      {/* Add more filters as needed */}
      <ul>
        {gigs.map((gig) => (
          <li key={gig.id}>
            {/* Display gig details */}
            <p>Location: {gig.event_location}</p>
            <p>Price: ${gig.offered_price}</p>
          </li>
        ))}
      </ul>
    </div>
       <MusicianEvents />
</Layout>
  );
}