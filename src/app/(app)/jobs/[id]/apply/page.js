"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { 
  Send, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  FileText,
  Video,
  Music,
  Briefcase,
  X
} from 'lucide-react';

export default function JobApplicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    cover_letter: "",
    motivation: "",
    years_of_experience: "",
    relevant_experience: "",
    portfolio_links: [""],
    available_start_date: "",
    conflicts: "",
  });

  useEffect(() => {
    if (id && user) {
      fetchJobDetails();
    }
  }, [id, user]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check if already applied
      const { data: existingApp } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_posting_id', id)
        .eq('musician_id', user.id)
        .single();

      if (existingApp) {
        router.push(`/jobs/${id}?already_applied=true`);
        return;
      }

      setJob(data);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.cover_letter.trim()) {
      setError("Please write a cover letter");
      return false;
    }
    if (!form.motivation.trim()) {
      setError("Please explain your motivation");
      return false;
    }
    if (!form.years_of_experience) {
      setError("Please enter your years of experience");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Filter out empty portfolio links
      const validPortfolioLinks = form.portfolio_links.filter(link => link.trim());

      const { error: dbError } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: id,
          musician_id: user.id,
          cover_letter: form.cover_letter.trim(),
          motivation: form.motivation.trim(),
          years_of_experience: parseInt(form.years_of_experience),
          relevant_experience: form.relevant_experience.trim(),
          portfolio_links: validPortfolioLinks,
          available_start_date: form.available_start_date || null,
          conflicts: form.conflicts.trim() || null,
          status: 'pending',
        });

      if (dbError) throw dbError;

      // Increment applications count
      await supabase.rpc('increment_job_applications', { job_id: id });

      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/jobs/${id}?application=success`);
      }, 2000);

    } catch (err) {
      setError(err.message);
      console.error('Application error:', err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const addPortfolioLink = () => {
    setForm({ ...form, portfolio_links: [...form.portfolio_links, ""] });
  };

  const removePortfolioLink = (index) => {
    const updated = form.portfolio_links.filter((_, i) => i !== index);
    setForm({ ...form, portfolio_links: updated });
  };

  const updatePortfolioLink = (index, value) => {
    const updated = [...form.portfolio_links];
    updated[index] = value;
    setForm({ ...form, portfolio_links: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !job) {
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
              Browse Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="max-w-3xl mx-auto px-4 py-6 text-white">
          <button
            onClick={() => router.back()}
            className="mb-3 text-white hover:text-purple-100 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Job
          </button>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Briefcase className="w-7 h-7" />
            Apply for Position
          </h1>
          <p className="text-purple-100 text-sm">
            {job.title}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-xl p-6 mb-6 flex items-center gap-3 animate-fadeIn">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
                Application Submitted!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Redirecting you back to the job posting...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Application Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Cover Letter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  <FileText className="w-4 h-4" />
                  Cover Letter *
                </label>
                <textarea
                  value={form.cover_letter}
                  onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
                  placeholder="Introduce yourself and explain why you're a great fit for this position..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows={6}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {form.cover_letter.length}/1000 characters
                </p>
              </div>

              {/* Motivation */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Why This Position? *
                </label>
                <textarea
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  placeholder="What interests you about this opportunity?"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows={4}
                  required
                />
              </div>

              {/* Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Years of Experience *
                  </label>
                  <input
                    type="number"
                    value={form.years_of_experience}
                    onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
                    placeholder="5"
                    min="0"
                    max="50"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Available Start Date
                  </label>
                  <input
                    type="date"
                    value={form.available_start_date}
                    onChange={(e) => setForm({ ...form, available_start_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
              </div>

              {/* Relevant Experience */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Relevant Experience
                </label>
                <textarea
                  value={form.relevant_experience}
                  onChange={(e) => setForm({ ...form, relevant_experience: e.target.value })}
                  placeholder="List past churches, venues, or organizations you've worked with..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows={4}
                />
              </div>

              {/* Portfolio Links */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  <Video className="w-4 h-4" />
                  Portfolio Links (Videos/Recordings)
                </label>
                <div className="space-y-3">
                  {form.portfolio_links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updatePortfolioLink(index, e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                      />
                      {form.portfolio_links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(index)}
                          className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPortfolioLink}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add another link
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Share links to your performances on YouTube, SoundCloud, etc.
                </p>
              </div>

              {/* Schedule Conflicts */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Schedule Conflicts (if any)
                </label>
                <textarea
                  value={form.conflicts}
                  onChange={(e) => setForm({ ...form, conflicts: e.target.value })}
                  placeholder="Any dates or times you're unavailable?"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows={3}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Make sure your portfolio links showcase your best work 
                  relevant to this position. High-quality videos increase your chances significantly!
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl text-lg"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Questions? Email us at{' '}
            <a href="mailto:jobs@amplygigs.com" className="text-purple-600 hover:underline">
              jobs@amplygigs.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}