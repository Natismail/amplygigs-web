"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Loader, 
  AlertCircle,
  ArrowLeft,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Eye,
  MessageSquare,
  Calendar,
  Award,
  Video,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';

export default function JobApplicationsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);

  const statusFilters = [
    { value: 'all', label: 'All Applications', icon: Users },
    { value: 'pending', label: 'Pending Review', icon: Clock },
    { value: 'shortlisted', label: 'Shortlisted', icon: Star },
    { value: 'interviewed', label: 'Interviewed', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
  ];

  useEffect(() => {
    if (id && user) {
      fetchJobAndApplications();
    }
  }, [id, user, selectedStatus]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;

      // Verify ownership
      if (jobData.posted_by !== user.id) {
        setError('You do not have permission to view these applications');
        return;
      }

      setJob(jobData);

      // Fetch applications with musician details
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          musician:user_profiles!musician_id(
            id,
            display_name,
            first_name,
            last_name,
            avatar_url,
            location,
            categories,
            genres,
            experience_years,
            hourly_rate,
            average_rating
          )
        `)
        .eq('job_posting_id', id)
        .order('applied_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data: appsData, error: appsError } = await query;

      if (appsError) throw appsError;

      setApplications(appsData || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(apps => 
        apps.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );

      // If viewing details, update selected application
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.musician?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.musician?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.musician?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              Error
            </h2>
            <p className="text-red-800 dark:text-red-200 mb-4">{error}</p>
            <button
              onClick={() => router.push('/jobs')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  // Application Detail Modal
  const ApplicationDetailModal = ({ application, onClose }) => {
    if (!application) return null;

    const musician = application.musician;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white">
                {musician?.avatar_url ? (
                  <Image 
                    src={musician.avatar_url} 
                    alt={musician.display_name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-purple-600">
                      {musician?.first_name?.[0]}{musician?.last_name?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{musician?.display_name || `${musician?.first_name} ${musician?.last_name}`}</h2>
                <p className="text-purple-100">{musician?.location}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {musician?.experience_years || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Years Exp</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {musician?.average_rating || '0.0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₦{musician?.hourly_rate?.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Hourly Rate</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Application Status</h3>
              <div className="flex flex-wrap gap-2">
                {['pending', 'shortlisted', 'interviewed', 'offered', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateApplicationStatus(application.id, status)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                      application.status === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Cover Letter
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {application.cover_letter}
                </p>
              </div>
            </div>

            {/* Motivation */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Why This Position?</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {application.motivation}
                </p>
              </div>
            </div>

            {/* Experience */}
            {application.relevant_experience && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Relevant Experience</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {application.relevant_experience}
                  </p>
                </div>
              </div>
            )}

            {/* Portfolio Links */}
            {application.portfolio_links && application.portfolio_links.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Portfolio
                </h3>
                <div className="space-y-2">
                  {application.portfolio_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
                    >
                      <ExternalLink className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 truncate">
                        {link}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Categories & Genres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {musician?.categories && musician.categories.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {musician.categories.map((cat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm">
                        {cat.category}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {musician?.genres && musician.genres.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {musician.genres.map((genre, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Application Date */}
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Applied on {new Date(application.applied_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => router.push(`/musician/${musician.id}`)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition"
              >
                View Full Profile
              </button>
              <button
                onClick={() => {
                  // TODO: Implement messaging
                  alert('Messaging feature coming soon!');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push(`/jobs/${id}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Job Posting
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              <p className="text-purple-100">
                Managing applications • {applications.length} total
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{applications.length}</div>
              <div className="text-sm text-purple-100">Applications</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {statusFilters.map((filter) => {
              const Icon = filter.icon;
              const count = filter.value === 'all' 
                ? applications.length 
                : applications.filter(app => app.status === filter.value).length;

              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${
                    selectedStatus === filter.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedStatus === filter.value
                      ? 'bg-white/20'
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by musician name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No applications found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedStatus === 'all' 
                ? 'No musicians have applied to this position yet.'
                : `No applications with status "${selectedStatus}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application) => {
              const musician = application.musician;
              
              return (
                <div
                  key={application.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition overflow-hidden group"
                >
                  {/* Musician Info */}
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {musician?.avatar_url ? (
                          <Image 
                            src={musician.avatar_url} 
                            alt={musician.display_name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-200 flex items-center justify-center">
                            <span className="text-xl font-bold text-purple-600">
                              {musician?.first_name?.[0]}{musician?.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {musician?.display_name || `${musician?.first_name} ${musician?.last_name}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {musician?.experience_years || 0} years experience
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {musician?.average_rating || '0.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                        application.status === 'interviewed' ? 'bg-purple-100 text-purple-800' :
                        application.status === 'offered' ? 'bg-green-100 text-green-800' :
                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>

                    {/* Cover Letter Preview */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-4">
                      {application.cover_letter}
                    </p>

                    {/* Portfolio Links */}
                    {application.portfolio_links && application.portfolio_links.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                        <Video className="w-4 h-4" />
                        {application.portfolio_links.length} portfolio {application.portfolio_links.length === 1 ? 'link' : 'links'}
                      </div>
                    )}

                    {/* Applied Date */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Applied {new Date(application.applied_at).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal 
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </div>
  );
}