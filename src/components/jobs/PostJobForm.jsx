"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  X, ChevronLeft, ChevronRight, Check, AlertCircle,
  Briefcase, DollarSign, Calendar, MapPin, Clock
} from "lucide-react";
import CategorySelector from "@/components/musician/CategorySelector";
import CurrencySelector from "@/components/CurrencySelector";
import { getCurrencyByCode, formatCurrency } from "@/components/CurrencySelector";


export default function PostJobForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    // Basic Info
    title: "",
    description: "",
    organization_name: user?.display_name || "",
    organization_type: "",
    
    // Job Details
    job_type: "",
    employment_type: "",
    
    // Categories (uses same as musician profiles)
    categories: [],
    required_skills: [],
    preferred_genres: [],
    
     // Compensation
  currency: "NGN", // ⭐ NEW
  country_code: "NG", // ⭐ NEW
  salary_type: "monthly",
  salary_min: "",
  salary_max: "",
  benefits: [],
    
    // Location
    location: "",
    city: "",
    state: "",
    is_remote: false,
    
    // Schedule
    schedule_details: "",
    
    // Audition (if applicable)
    audition_date: "",
    audition_time: "",
    audition_location: "",
    audition_format: "in_person",
    audition_requirements: "",
    
    // Application
    application_deadline: "",
    min_experience_years: "",
    requires_own_equipment: false,
    
    // Additional
    contract_duration: "",
    start_date: "",
  });

  const organizationTypes = [
    { value: "church", label: "⛪ Church", description: "Religious organization" },
    { value: "venue", label: "🏢 Venue / Club", description: "Entertainment venue" },
    { value: "band", label: "🎸 Band", description: "Musical group" },
    { value: "corporate", label: "💼 Corporate", description: "Business events" },
    { value: "school", label: "🎓 School / Academy", description: "Educational institution" },
    { value: "event_company", label: "🎉 Event Company", description: "Event planning" },
    { value: "other", label: "📋 Other", description: "Other organization" }
  ];

  const jobTypes = [
    { value: "audition", label: "🎤 Audition", description: "Hold auditions for permanent role" },
    { value: "permanent", label: "💼 Permanent", description: "Long-term employment" },
    { value: "contract", label: "📝 Contract", description: "Fixed-term contract" },
    { value: "part_time", label: "⏰ Part-Time", description: "Part-time position" }
  ];

  const employmentTypes = [
    "Full-Time",
    "Part-Time", 
    "Weekend Only",
    "Contract",
    "Per Service"
  ];

  const salaryTypes = [
    { value: "monthly", label: "Per Month" },
    { value: "weekly", label: "Per Week" },
    { value: "per_service", label: "Per Service" },
    { value: "hourly", label: "Per Hour" },
    { value: "negotiable", label: "Negotiable" }
  ];

  const auditionFormats = [
    { value: "in_person", label: "In-Person Audition" },
    { value: "video_submission", label: "Video Submission" },
    { value: "live_stream", label: "Live Stream Audition" },
    { value: "hybrid", label: "Hybrid (In-person + Video)" }
  ];

  const validateStep = (step) => {
    setError(null);
    
    if (step === 1) {
      if (!form.title.trim()) {
        setError("Job title is required");
        return false;
      }
      if (!form.description.trim()) {
        setError("Job description is required");
        return false;
      }
      if (!form.organization_type) {
        setError("Please select organization type");
        return false;
      }
      if (!form.job_type) {
        setError("Please select job type");
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      if (form.categories.length === 0) {
        setError("Please select at least one category");
        return false;
      }
      return true;
    }
    
    if (step === 3) {
      if (!form.salary_min) {
        setError("Minimum salary is required");
        return false;
      }
      if (!form.location.trim()) {
        setError("Location is required");
        return false;
      }
      if (!form.schedule_details.trim()) {
        setError("Schedule details are required");
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!form.application_deadline) {
        setError("Application deadline is required");
        return false;
      }
      
      // Validate deadline is in future
      const deadline = new Date(form.application_deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline < today) {
        setError("Application deadline must be in the future");
        return false;
      }
      
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setLoading(true);
    setError(null);

    if (!user) {
      setError("You must be logged in to post a job.");
      setLoading(false);
      return;
    }

    try {
      // Extract primary category and subcategories
      const primaryCat = form.categories.find(c => c.isPrimary) || form.categories[0];
      const allSubcategories = form.categories.reduce((acc, cat) => {
        return [...acc, ...cat.subcategories];
      }, []);

      // Combine audition date and time if provided
      let auditionDateTime = null;
      if (form.audition_date) {
        auditionDateTime = form.audition_time 
          ? `${form.audition_date}T${form.audition_time}:00`
          : `${form.audition_date}T00:00:00`;
      }

      const payload = {
        posted_by: user.id,
        organization_name: form.organization_name || user.display_name,
        organization_type: form.organization_type,
        
        title: form.title.trim(),
        description: form.description.trim(),
        job_type: form.job_type,
        
        // Categories
        category: primaryCat?.category || null,
        subcategories: allSubcategories,
        required_skills: form.required_skills,
        preferred_genres: form.preferred_genres,
        
        // Employment
        employment_type: form.employment_type || null,
        salary_type: form.salary_type,
        salary_min: parseFloat(form.salary_min),
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        currency: form.currency, // ⭐ CHANGED
        country_code: form.country_code, // ⭐ NEW
        benefits: form.benefits,
        
        // Location
        location: form.location.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        is_remote: form.is_remote,
        schedule_details: form.schedule_details.trim(),
        
        // Audition
        audition_date: auditionDateTime,
        audition_location: form.audition_location.trim() || null,
        audition_format: form.audition_format,
        audition_requirements: form.audition_requirements.trim() || null,
        
        // Application
        application_deadline: `${form.application_deadline}T23:59:59`,
        min_experience_years: form.min_experience_years ? parseInt(form.min_experience_years) : 0,
        requires_own_equipment: form.requires_own_equipment,
        
        // Contract
        contract_duration: form.contract_duration.trim() || null,
        start_date: form.start_date || null,
        
        // Status
        status: 'draft', // Will be activated after payment
        posting_fee_paid: false,
        placement_fee_percentage: 15.0,
      };

      console.log('💼 Creating job posting:', payload);

      const { data: jobData, error: dbError } = await supabase
        .from("job_postings")
        .insert([payload])
        .select()
        .single();

      if (dbError) throw dbError;

      console.log('✅ Job posting created:', jobData);

      // Redirect to payment page
      router.push(`/jobs/payment/${jobData.id}`);

    } catch (err) {
      setError(err.message);
      console.error("❌ Post job error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-7 h-7" />
              Post a Job / Audition
            </h2>
            <p className="text-purple-100 text-sm mt-1">
              Step {currentStep} of 4
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-purple-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 overflow-y-auto flex-1">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Posting Fee Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Job Posting Fee: ₦10,000
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Pay once to publish your job listing for 30 days. If hired through AmplyGigs, 
                a 15% placement fee on first month's salary applies.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Worship Guitarist, Wedding Band Director"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={form.organization_name}
                  onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                  placeholder="Your church, venue, or organization name"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Organization Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {organizationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, organization_type: type.value })}
                      className={`p-4 rounded-xl text-left border-2 transition ${
                        form.organization_type === type.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Job Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {jobTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, job_type: type.value })}
                      className={`p-4 rounded-xl text-left border-2 transition ${
                        form.job_type === type.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Job Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows="6"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {form.description.length}/1000 characters
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Required Skills & Categories */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Required Skills & Categories
              </h3>

              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                  Category & Instruments/Skills Needed *
                </label>
                <CategorySelector
                  value={form.categories}
                  onChange={(categories) => setForm({ ...form, categories })}
                  error={null}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Employment Type
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                >
                  <option value="">Select employment type</option>
                  {employmentTypes.map(type => (
                    <option key={type} value={type.toLowerCase().replace(' ', '_')}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Minimum Experience Required (years)
                </label>
                <input
                  type="number"
                  value={form.min_experience_years}
                  onChange={(e) => setForm({ ...form, min_experience_years: e.target.value })}
                  placeholder="e.g., 2"
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <input
                  type="checkbox"
                  id="own_equipment"
                  checked={form.requires_own_equipment}
                  onChange={(e) => setForm({ ...form, requires_own_equipment: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="own_equipment" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Musician must have their own equipment
                </label>
              </div>
            </div>
          )}

{/* Step 3: Compensation & Schedule */}
{currentStep === 3 && (
  <div className="space-y-5 animate-fadeIn">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <DollarSign className="w-6 h-6" />
      Compensation & Schedule
    </h3>

    {/* ⭐ NEW: Currency Selector */}
    <CurrencySelector
      value={form.currency}
      onChange={(currency) => setForm({ 
        ...form, 
        currency: currency.code,
        country_code: currency.countryCode 
      })}
      label="Salary Currency"
      showPaymentProvider={false}
    />

    <div>
      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
        Salary Type
      </label>
      <select
        value={form.salary_type}
        onChange={(e) => setForm({ ...form, salary_type: e.target.value })}
        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
      >
        {salaryTypes.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
    </div>

    {/* ⭐ ENHANCED: Salary inputs with currency symbol */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Minimum Salary *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
            {getCurrencyByCode(form.currency).symbol}
          </span>
          <input
            type="number"
            value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
            placeholder={`e.g., ${form.currency === 'NGN' ? '80000' : '1500'}`}
            min="0"
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Maximum Salary
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
            {getCurrencyByCode(form.currency).symbol}
          </span>
          <input
            type="number"
            value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
            placeholder={`e.g., ${form.currency === 'NGN' ? '120000' : '2000'}`}
            min="0"
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Optional - leave blank if flexible
        </p>
      </div>
    </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location *
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Victoria Island, Lagos"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Lagos"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="Lagos"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Schedule Details *
                </label>
                <textarea
                  value={form.schedule_details}
                  onChange={(e) => setForm({ ...form, schedule_details: e.target.value })}
                  placeholder="e.g., Sundays 8am-12pm, Wednesdays 6pm-8pm"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Contract Duration
                  </label>
                  <input
                    type="text"
                    value={form.contract_duration}
                    onChange={(e) => setForm({ ...form, contract_duration: e.target.value })}
                    placeholder="e.g., 1 year, indefinite"
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Application & Audition Details */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Application & Audition Details
              </h3>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Application Deadline *
                </label>
                <input
                  type="date"
                  value={form.application_deadline}
                  onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last date for musicians to apply
                </p>
              </div>

              {/* Audition Details (if job type is audition) */}
              {form.job_type === 'audition' && (
                <>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      🎤 Audition Information
                    </h4>
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      Provide details about your audition process
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Audition Format
                    </label>
                    <select
                      value={form.audition_format}
                      onChange={(e) => setForm({ ...form, audition_format: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                    >
                      {auditionFormats.map(format => (
                        <option key={format.value} value={format.value}>{format.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Audition Date
                      </label>
                      <input
                        type="date"
                        value={form.audition_date}
                        onChange={(e) => setForm({ ...form, audition_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Audition Time
                      </label>
                      <input
                        type="time"
                        value={form.audition_time}
                        onChange={(e) => setForm({ ...form, audition_time: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                      />
                    </div>
                  </div>

                  {form.audition_format !== 'video_submission' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        Audition Location
                      </label>
                      <input
                        type="text"
                        value={form.audition_location}
                        onChange={(e) => setForm({ ...form, audition_location: e.target.value })}
                        placeholder="Where will the audition take place?"
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white text-base"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Audition Requirements
                    </label>
                    <textarea
                      value={form.audition_requirements}
                      onChange={(e) => setForm({ ...form, audition_requirements: e.target.value })}
                      placeholder="e.g., Prepare 2 songs, sight reading test, bring your instrument"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white resize-none text-base"
                      rows="4"
                    />
                  </div>
                </>
              )}

              {/* Summary */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Ready to Post
                </h4>
                <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                  <p><strong>Title:</strong> {form.title || 'Not set'}</p>
                  <p><strong>Type:</strong> {form.job_type || 'Not set'}</p>
                  <p><strong>Salary:</strong> ₦{form.salary_min?.toLocaleString() || '0'} - ₦{form.salary_max?.toLocaleString() || 'Open'}</p>
                  <p><strong>Location:</strong> {form.location || 'Not set'}</p>
                  <p><strong>Deadline:</strong> {form.application_deadline || 'Not set'}</p>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  Click "Proceed to Payment" to pay ₦10,000 and publish your job listing
                </p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition shadow-lg"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Proceed to Payment
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}