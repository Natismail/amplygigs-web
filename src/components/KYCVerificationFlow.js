"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useKYC } from '@/hooks/useKYC';
import { useRouter } from 'next/navigation';
import { Camera, Upload, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function KYCVerificationFlow() {
  const router = useRouter();
  const {
    verification,
    loading,
    uploading,
    error,
    isVerified,
    isPending,
    completionPercentage,
    submitIDVerification,
    submitSelfieVerification,
  } = useKYC();

  const [step, setStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: '',
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState({
    idFront: null,
    idBack: null,
    selfie: null,
  });

  // ⭐ NEW: Track if user is in active submission flow
  const [inSubmissionFlow, setInSubmissionFlow] = useState(false);

  // ⭐ Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  // ⭐ FIXED: Set initial step based on verification data ONLY on first load
  useEffect(() => {
    if (loading || !verification) return;

    // If user is already verified or under review, show that status
    if (isVerified || isPending) {
      setInSubmissionFlow(false);
      return;
    }

    // Check what's been completed
    const hasID = verification.id_front_image_url && verification.id_back_image_url;
    const hasSelfie = verification.selfie_image_url;

    if (!hasID) {
      setStep(1);
    } else if (hasID && !hasSelfie) {
      setStep(2);
    } else if (hasID && hasSelfie) {
      setStep(3);
    }
  }, [loading, verification, isVerified, isPending]);

  const validateIDNumber = (idType, idNumber) => {
    if (!idNumber || !idNumber.trim()) {
      return 'ID number is required';
    }

    const trimmed = idNumber.trim();

    switch (idType) {
      case 'national_id':
        if (!/^\d{11}$/.test(trimmed)) {
          return 'NIN must be exactly 11 digits';
        }
        break;
      case 'drivers_license':
        if (trimmed.length < 8) {
          return 'Driver\'s License must be at least 8 characters';
        }
        break;
      case 'passport':
        if (!/^[A-Z]\d{8}$/.test(trimmed)) {
          return 'Passport must be 1 letter followed by 8 digits (e.g., A12345678)';
        }
        break;
      case 'voters_card':
        if (trimmed.length < 8) {
          return 'Voter\'s Card must be at least 8 characters';
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const validateFile = (file, fieldName) => {
    if (!file) {
      return `${fieldName} is required`;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return `${fieldName} must be less than 5MB`;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return `${fieldName} must be JPG, PNG, or WebP`;
    }

    return null;
  };

  const handleFileChange = (field, file) => {
    if (!file) return;

    const error = validateFile(file, field);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
      return;
    }

    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    if (previews[field]) {
      URL.revokeObjectURL(previews[field]);
    }

    const previewURL = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [field]: previewURL }));
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const validateStep1 = () => {
    const errors = {};

    const idError = validateIDNumber(formData.idType, formData.idNumber);
    if (idError) {
      errors.idNumber = idError;
    }

    const frontError = validateFile(formData.idFront, 'ID Front');
    if (frontError) {
      errors.idFront = frontError;
    }

    const backError = validateFile(formData.idBack, 'ID Back');
    if (backError) {
      errors.idBack = backError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ⭐ FIXED: Don't check database status, just move to next step
  const handleIDSubmit = async () => {
    if (!validateStep1()) {
      return;
    }

    setInSubmissionFlow(true); // ⭐ Mark as in submission flow

    try {
      const result = await submitIDVerification({
        idType: formData.idType,
        idNumber: formData.idNumber.trim(),
        idFront: formData.idFront,
        idBack: formData.idBack,
      });

      if (result.success) {
        // ⭐ Always move to step 2, regardless of database status
        setStep(2);
        setValidationErrors({});
      }
    } catch (err) {
      console.error('ID verification error:', err);
      setInSubmissionFlow(false);
    }
  };

  // ⭐ FIXED: Move to step 3 after selfie submission
  const handleSelfieSubmit = async () => {
    const selfieError = validateFile(formData.selfie, 'Selfie');
    if (selfieError) {
      setValidationErrors({ selfie: selfieError });
      return;
    }

    try {
      const result = await submitSelfieVerification(formData.selfie);

      if (result.success) {
        // ⭐ Move to success step
        setStep(3);
        setValidationErrors({});
      }
    } catch (err) {
      console.error('Selfie verification error:', err);
    }
  };

  // Loading state
  if (loading && !verification) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // ⭐ FIXED: Only show verified/pending status if NOT in active submission flow
  if (!inSubmissionFlow) {
    if (isVerified) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Verification Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your profile is verified. You can now receive bookings and start earning.
            </p>
            <button
              onClick={() => router.push('/musician/dashboard')}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (isPending && step === 3) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-12 h-12 text-yellow-600 dark:text-yellow-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Under Review
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;re reviewing your documents. You&apos;ll be notified within 24-48 hours.
            </p>
            <button
              onClick={() => router.push('/musician/dashboard')}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-700 hover:to-yellow-800 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/musician/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Progress Bar */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Progress
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-700 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-8 relative">
          {[
            { num: 1, label: 'ID Verification' },
            { num: 2, label: 'Selfie Verification' },
            { num: 3, label: 'Complete' }
          ].map(({ num, label }) => (
            <div key={num} className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= num
                  ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {step > num ? <CheckCircle2 className="w-6 h-6" /> : num}
              </div>
              <span className="text-xs mt-2 text-center font-medium text-gray-600 dark:text-gray-400">
                {label}
              </span>
            </div>
          ))}
          {/* Progress line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0" />
          <div 
            className="absolute top-6 left-0 h-0.5 bg-purple-600 -z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>

        {/* Global Error */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200 mb-1">
                Verification Error
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: ID Verification */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ID Verification
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Upload a valid government-issued ID to verify your identity
              </p>
            </div>

            <div className="space-y-6">
              {/* ID Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select ID Type
                </label>
                <select
                  value={formData.idType}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, idType: e.target.value, idNumber: '' }));
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.idNumber;
                      return newErrors;
                    });
                  }}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                >
                  <option value="national_id">National ID (NIN)</option>
                  <option value="drivers_license">Driver&apos;s License</option>
                  <option value="passport">International Passport</option>
                  <option value="voters_card">Voter&apos;s Card</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, idNumber: e.target.value }));
                    setValidationErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.idNumber;
                      return newErrors;
                    });
                  }}
                  placeholder={
                    formData.idType === 'national_id' ? '12345678901 (11 digits)' :
                    formData.idType === 'passport' ? 'A12345678' :
                    'Enter your ID number'
                  }
                  className={`w-full p-3.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                    validationErrors.idNumber
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {validationErrors.idNumber && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.idNumber}
                  </p>
                )}
              </div>

              {/* ID Front */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ID Front Photo
                </label>
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition ${
                  validationErrors.idFront
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('idFront', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previews.idFront ? (
                    <div className="space-y-3">
                      <Image
                        src={previews.idFront}
                        alt="ID Front"
                        width={400}
                        height={250}
                        className="mx-auto rounded-lg border-2 border-purple-200 dark:border-purple-800"
                      />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {formData.idFront.name}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG or WebP (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                {validationErrors.idFront && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.idFront}
                  </p>
                )}
              </div>

              {/* ID Back */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ID Back Photo
                </label>
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition ${
                  validationErrors.idBack
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('idBack', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previews.idBack ? (
                    <div className="space-y-3">
                      <Image
                        src={previews.idBack}
                        alt="ID Back"
                        width={400}
                        height={250}
                        className="mx-auto rounded-lg border-2 border-purple-200 dark:border-purple-800"
                      />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {formData.idBack.name}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG or WebP (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                {validationErrors.idBack && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.idBack}
                  </p>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photo Guidelines
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Ensure all text and details are clearly visible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Take photos in bright, even lighting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Avoid glare, shadows, and reflections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>ID should fill most of the frame</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleIDSubmit}
                disabled={uploading || !formData.idFront || !formData.idBack || !formData.idNumber}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Continue to Selfie Verification'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Selfie Verification */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Selfie Verification
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Take a clear selfie to match with your ID photo
              </p>
            </div>

            <div className="space-y-6">
              {/* Selfie Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Take a Selfie
                </label>
                <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition ${
                  validationErrors.selfie
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFileChange('selfie', e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previews.selfie ? (
                    <div className="space-y-3">
                      <Image
                        src={previews.selfie}
                        alt="Selfie"
                        width={400}
                        height={400}
                        className="mx-auto rounded-2xl border-2 border-purple-200 dark:border-purple-800 w-full max-w-sm"
                      />
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Selfie captured
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Take a selfie or upload a photo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG or WebP (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
                {validationErrors.selfie && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.selfie}
                  </p>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Selfie Guidelines
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Face the camera directly and look straight ahead</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Ensure good, even lighting on your face</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Remove sunglasses, hats, or face coverings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Keep a neutral expression (no smiling)</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setInSubmissionFlow(true);
                  }}
                  disabled={uploading}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSelfieSubmit}
                  disabled={uploading || !formData.selfie}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Verification'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Submitted Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Thank you for submitting your verification documents. We&apos;ll review them and notify you within 24-48 hours.
            </p>
            <button
              onClick={() => router.push('/musician/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


