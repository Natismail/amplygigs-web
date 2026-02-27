//src/app/(app)/jobs/page.js

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { getCurrencyByCode, formatCurrency } from "@/components/CurrencySelector";

import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  Search,
  Star,
  Loader,
  Users,
  Building2,
  ArrowLeft
} from 'lucide-react';

export default function JobsContent() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    jobType: 'all',
    location: '',
    salaryMin: '',
  });

  const categories = [
    'All Categories',
    'Singer',
    'Instrumentalist',
    'DJ',
    'Producer',
    'Band',
    'Conductor/Director',
    'MC/Host',
    'Performer',
    'Other'
  ];

  const jobTypes = [
    'All Types',
    'Audition',
    'Permanent',
    'Contract',
    'Part-Time'
  ];

  useEffect(() => {
  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  checkUser();
}, []);


  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    
    try {
      // Step 1: Fetch jobs
      let query = supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'active')
        .gte('application_deadline', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category !== 'all' && filters.category !== 'All Categories') {
        query = query.eq('category', filters.category);
      }

      if (filters.jobType !== 'all' && filters.jobType !== 'All Types') {
        query = query.eq('job_type', filters.jobType.toLowerCase());
      }

      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,location.ilike.%${filters.location}%`);
      }

      if (filters.salaryMin) {
        query = query.gte('salary_min', parseInt(filters.salaryMin));
      }

      const { data: jobsData, error } = await query;
      
      if (error) throw error;

      // Step 2: Fetch poster profiles separately (SECURE APPROACH)
      if (jobsData && jobsData.length > 0) {
        const posterIds = [...new Set(jobsData.map(job => job.posted_by))];
        
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, display_name, first_name, last_name, organization_name')
          .in('id', posterIds);

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        // Step 3: Map profiles to jobs
        const profileMap = {};
        profiles?.forEach(p => {
          profileMap[p.id] = p;
        });

        // Attach poster info to each job
        const jobsWithPosters = jobsData.map(job => ({
          ...job,
          poster: profileMap[job.posted_by] || {
            display_name: 'Anonymous',
            organization_name: null
          }
        }));

        setJobs(jobsWithPosters);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Music Jobs & Auditions
          </h1>
          <p className="text-xl text-purple-100">
            Find permanent positions, contract work, and audition opportunities
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{jobs.length}</div>
              <div className="text-sm text-purple-100">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{jobs.filter(j => j.job_type === 'audition').length}</div>
              <div className="text-sm text-purple-100">Auditions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{jobs.filter(j => j.job_type === 'permanent').length}</div>
              <div className="text-sm text-purple-100">Permanent</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search Location */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by location..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Job Type */}
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white"
            >
              {jobTypes.map(type => (
                <option key={type} value={type === 'All Types' ? 'all' : type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Min Salary */}
            <input
              type="number"
              placeholder="Min salary"
              value={filters.salaryMin}
              onChange={(e) => setFilters({ ...filters, salaryMin: e.target.value })}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Active Filters Display */}
          {(filters.location || filters.category !== 'all' || filters.jobType !== 'all' || filters.salaryMin) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.location && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm flex items-center gap-2">
                  Location: {filters.location}
                  <button onClick={() => setFilters({ ...filters, location: '' })}>×</button>
                </span>
              )}
              {filters.category !== 'all' && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm flex items-center gap-2">
                  {filters.category}
                  <button onClick={() => setFilters({ ...filters, category: 'all' })}>×</button>
                </span>
              )}
              <button
                onClick={() => setFilters({ category: 'all', jobType: 'all', location: '', salaryMin: '' })}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{jobs.length}</span> job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or check back later
            </p>
            <button
              onClick={() => setFilters({ category: 'all', jobType: 'all', location: '', salaryMin: '' })}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition">
                        {job.title}
                      </h3>
                      
                      {job.visibility === 'featured' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.job_type === 'audition' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {job.job_type === 'audition' ? '🎤 Audition' : '💼 Job'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                      <Building2 className="w-4 h-4" />
                      <span>{job.organization_name || job.poster?.organization_name || job.poster?.display_name || 'Organization'}</span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.city}, {job.state}</span>
                  </div>
                  
                  {job.salary_min && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>  {formatCurrency(job.salary_min || 0, job.currency || 'NGN')} -   {formatCurrency(job.salary_max || 0, job.currency || 'NGN') || 'Open'} / {job.salary_type}</span>
                    </div>
                  )}
                  
                  {job.audition_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Audition: {new Date(job.audition_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Closes: {new Date(job.application_deadline).toLocaleDateString()}</span>
                  </div>
                  
                  {job.applications_count > 0 && (
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{job.applications_count} applicants</span>
                    </div>
                  )}
                </div>

                {/* Skills/Categories */}
                {job.subcategories && job.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {job.subcategories.slice(0, 5).map((sub, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                        {sub}
                      </span>
                    ))}
                    {job.subcategories.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                        +{job.subcategories.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
          
          {!user && (
                    <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">

            <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Dream Music Job?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Sign up now to apply for positions and showcase your talent
          </p>
  <button
    onClick={() => router.push('/signup')}
    className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl transition transform hover:scale-105"
  >
    Get Started Free
  </button>
        </div>

)}
          {/* <button
            onClick={() => router.push('/signup')}
            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-2xl transition transform hover:scale-105"
          >
            Get Started Free
          </button> */}
        </div>
    </div>
  );
}