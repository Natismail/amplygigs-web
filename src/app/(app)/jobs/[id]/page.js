//src/app/(app)/jobs/[id]/page.js

"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Send,
  Building2,
  Users
} from 'lucide-react';

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      
      // Check for payment success
      if (searchParams.get('payment') === 'success') {
        setShowPaymentSuccess(true);
        setTimeout(() => setShowPaymentSuccess(false), 5000);
      }
    }
  }, [id, searchParams]);

  useEffect(() => {
    if (job && user) {
      checkIfApplied();
    }
  }, [job, user]);

  const fetchJobDetails = async () => {
    try {
      // Increment view count
      await supabase.rpc('increment_job_views', { job_id: id });

      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          poster:user_profiles!posted_by(
            id,
            display_name,
            first_name,
            last_name,
            avatar_url,
            location
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setJob(data);
    } catch (err) {
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_posting_id', id)
        .eq('musician_id', user.id)
        .single();

      if (data) setHasApplied(true);
    } catch (err) {
      // No application found
    }
  };

  const handleApply = () => {
    if (!user) {
      router.push(`/auth/signin?returnTo=/jobs/${id}`);
      return;
    }

    if (user.role !== 'MUSICIAN') {
      alert('Only musicians can apply to jobs');
      return;
    }

    router.push(`/jobs/${id}/apply`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Job Not Found
          </h2>
          <button
            onClick={() => router.push('/jobs')}
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      {/* Payment Success Banner */}
      {showPaymentSuccess && (
        <div className="bg-green-600 text-white py-4 px-4 text-center animate-slideDown">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <p className="font-semibold">
              Payment successful! Your job posting is now live.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Job Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      job.job_type === 'audition' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {job.job_type === 'audition' ? '🎤 Audition' : '💼 Job'}
                    </span>
                    {job.visibility === 'featured' && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Building2 className="w-5 h-5" />
                    <span>{job.organization_name}</span>
                  </div>
                </div>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {job.city}, {job.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Salary</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₦{job.salary_min?.toLocaleString()}+
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {job.employment_type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Applicants</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {job.applications_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Job Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Requirements
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Category & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.subcategories?.map((sub, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {job.min_experience_years > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Experience
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Minimum {job.min_experience_years} years
                    </p>
                  </div>
                )}

                {job.requires_own_equipment && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Equipment
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      Must have own equipment
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Audition Details */}
            {job.job_type === 'audition' && job.audition_date && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🎤 Audition Information
                </h2>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>
                      {new Date(job.audition_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {job.audition_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <span>{job.audition_location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Format:</span>
                    <span className="capitalize">{job.audition_format?.replace('_', ' ')}</span>
                  </div>
                  {job.audition_requirements && (
                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                      <p className="font-semibold mb-2">What to Prepare:</p>
                      <p className="text-sm">{job.audition_requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Apply Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-4">
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Application Deadline
                </p>
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">
                    {new Date(job.application_deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {hasApplied ? (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-4 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Application Submitted
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    You've already applied to this job
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition shadow-lg"
                >
                  <Send className="w-5 h-5" />
                  Apply Now
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Facts
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Views</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {job.views_count || 0}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Posted</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {new Date(job.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600 dark:text-gray-400">Type</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">
                      {job.organization_type}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Schedule
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {job.schedule_details}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}