"use client";

import Image from 'next/image';
import { useState } from 'react';
import { useKYC } from '@/hooks/useKYC';
import { useRouter } from 'next/navigation';

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
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: '',
    idFront: null,
    idBack: null,
    selfie: null,
  });

  const handleFileChange = (field, file) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleIDSubmit = async () => {
    const result = await submitIDVerification({
      idType: formData.idType,
      idNumber: formData.idNumber,
      idFront: formData.idFront,
      idBack: formData.idBack,
    });

    if (result.success) {
      setStep(2);
    }
  };

  const handleSelfieSubmit = async () => {
    const result = await submitSelfieVerification(formData.selfie);

    if (result.success) {
      setStep(3);
    }
  };

  if (loading && !verification) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
            Verified!
          </h2>
          <p className="text-green-800 dark:text-green-200 mb-6">
            Your profile has been verified. You can now receive bookings!
          </p>
          <button
            onClick={() => router.push('/musician/dashboard')}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
            Under Review
          </h2>
          <p className="text-yellow-800 dark:text-yellow-200 mb-6">
            We&apos;re reviewing your documents. This usually takes 24-48 hours.
          </p>
          <button
            onClick={() => router.push('/musician/dashboard')}
            className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-yellow-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-purple-700 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= num
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {num}
              </div>
              <span className="text-xs mt-2 text-center">
                {num === 1 && 'ID Verification'}
                {num === 2 && 'Selfie'}
                {num === 3 && 'Complete'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: ID Verification */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-2">ID Verification</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload a valid government-issued ID to verify your identity
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* ID Type */}
              <div>
                <label className="block text-sm font-medium mb-2">ID Type</label>
                <select
                  value={formData.idType}
                  onChange={(e) => setFormData(prev => ({ ...prev, idType: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                >
                  <option value="national_id">National ID (NIN)</option>
                  <option value="drivers_license">Driver&apos;s License</option>
                  <option value="passport">International Passport</option>
                  <option value="voters_card">Voter&apos;s Card</option>
                </select>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-medium mb-2">ID Number</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                  placeholder="Enter your ID number"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
              </div>

              {/* ID Front */}
              <div>
                <label className="block text-sm font-medium mb-2">ID Front Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('idFront', e.target.files[0])}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
                {formData.idFront && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.idFront.name}</p>
                )}
              </div>

              {/* ID Back */}
              <div>
                <label className="block text-sm font-medium mb-2">ID Back Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('idBack', e.target.files[0])}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
                {formData.idBack && (
                  <p className="text-sm text-green-600 mt-2">✓ {formData.idBack.name}</p>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📸 Photo Tips:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Ensure all text is clearly visible</li>
                  <li>• Take photos in good lighting</li>
                  <li>• Avoid glare and shadows</li>
                  <li>• ID should fill most of the frame</li>
                </ul>
              </div>

              <button
                onClick={handleIDSubmit}
                disabled={uploading || !formData.idFront || !formData.idBack}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Selfie Verification */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Selfie Verification</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Take a selfie to match with your ID photo
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Selfie Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Take a Selfie</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => handleFileChange('selfie', e.target.files[0])}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                />
                {formData.selfie && (
                  <div className="mt-4">
                    <Image
                      src={URL.createObjectURL(formData.selfie)}
                      alt="Selfie preview"
                      className="w-full max-w-xs mx-auto rounded-lg"
                      width = {40}
                      height = {40}
                    />
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🤳 Selfie Tips:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Face the camera directly</li>
                  <li>• Ensure good lighting on your face</li>
                  <li>• Remove sunglasses and hats</li>
                  <li>• Keep a neutral expression</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleSelfieSubmit}
                  disabled={uploading || !formData.selfie}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Submit Verification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Submitted Successfully!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ll review your documents and get back to you within 24-48 hours.
            </p>
            <button
              onClick={() => router.push('/musician/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}