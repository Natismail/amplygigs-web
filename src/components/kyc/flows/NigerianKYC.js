// src/components/kyc/flows/NigerianKYC.js - COMPLETE NIGERIAN KYC FLOW
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKYC } from '@/hooks/useKYC';
import ProgressBar from '../shared/ProgressBar';
import FileUpload from '../shared/FileUpload';
import IDTypeSelector from '../shared/IDTypeSelector';
import { ArrowLeft, CheckCircle2, Camera, FileText } from 'lucide-react';

const NIGERIAN_ID_TYPES = [
  { 
    value: 'national_id', 
    label: 'National ID (NIN)', 
    icon: '🪪', 
    description: '11-digit NIN number' 
  },
  { 
    value: 'drivers_license', 
    label: "Driver's License", 
    icon: '🚗', 
    description: 'Nigerian driver\'s license' 
  },
  { 
    value: 'passport', 
    label: 'International Passport', 
    icon: '🛂', 
    description: 'Format: A12345678' 
  },
  { 
    value: 'voters_card', 
    label: "Voter's Card", 
    icon: '🗳️', 
    description: 'Permanent Voter\'s Card (PVC)' 
  },
];

const STEPS = ['ID Document', 'Selfie Verification', 'Complete'];

export default function NigerianKYC({ country = 'Nigeria' }) {
  const router = useRouter();
  const { submitIDVerification, submitSelfieVerification, uploading } = useKYC();
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    idType: 'national_id',
    idNumber: '',
    idFront: null,
    idBack: null,
    selfie: null
  });
  const [errors, setErrors] = useState({});

  // Validation function
  const validateIDNumber = (idType, idNumber) => {
    if (!idNumber?.trim()) return 'ID number is required';
    
    const trimmed = idNumber.trim();
    
    switch (idType) {
      case 'national_id':
        return !/^\d{11}$/.test(trimmed) ? 'NIN must be exactly 11 digits' : null;
      case 'passport':
        return !/^[A-Z]\d{8}$/.test(trimmed) ? 'Passport must be format: A12345678 (1 letter + 8 digits)' : null;
      case 'drivers_license':
        return trimmed.length < 8 ? 'Driver\'s License must be at least 8 characters' : null;
      case 'voters_card':
        return trimmed.length < 8 ? 'Voter\'s Card number must be at least 8 characters' : null;
      default:
        return null;
    }
  };

  const handleIDSubmit = async () => {
    // Validate
    const idError = validateIDNumber(formData.idType, formData.idNumber);
    const newErrors = {
      idNumber: idError,
      idFront: !formData.idFront ? 'ID front photo is required' : null,
      idBack: !formData.idBack ? 'ID back photo is required' : null
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(err => err !== null)) {
      return;
    }

    // Submit
    const result = await submitIDVerification({
      idType: formData.idType,
      idNumber: formData.idNumber.trim(),
      idFront: formData.idFront,
      idBack: formData.idBack
    });

    if (result.success) {
      setStep(1);
      setErrors({});
    }
  };

  const handleSelfieSubmit = async () => {
    if (!formData.selfie) {
      setErrors({ selfie: 'Selfie photo is required' });
      return;
    }

    const result = await submitSelfieVerification(formData.selfie);
    
    if (result.success) {
      setStep(2);
      setErrors({});
    }
  };

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
        <ProgressBar currentStep={step} totalSteps={STEPS.length} steps={STEPS} />

        {/* Step 0: ID Document */}
        {step === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Nigerian ID Verification
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Upload a valid government-issued ID to verify your identity
              </p>
            </div>

            <div className="space-y-6">
              {/* ID Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Select ID Type
                </label>
                <IDTypeSelector
                  options={NIGERIAN_ID_TYPES}
                  selected={formData.idType}
                  onChange={(value) => {
                    setFormData({ ...formData, idType: value, idNumber: '' });
                    setErrors({ ...errors, idNumber: null });
                  }}
                />
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, idNumber: e.target.value });
                    setErrors({ ...errors, idNumber: null });
                  }}
                  placeholder={
                    formData.idType === 'national_id' ? '12345678901 (11 digits)' :
                    formData.idType === 'passport' ? 'A12345678' :
                    'Enter your ID number'
                  }
                  className={`w-full p-3.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition ${
                    errors.idNumber 
                      ? 'border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.idNumber && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                    {errors.idNumber}
                  </p>
                )}
              </div>

              {/* ID Front Photo */}
              <FileUpload
                label="ID Front Photo"
                file={formData.idFront}
                onChange={(file) => {
                  setFormData({ ...formData, idFront: file });
                  setErrors({ ...errors, idFront: null });
                }}
                error={errors.idFront}
              />

              {/* ID Back Photo */}
              <FileUpload
                label="ID Back Photo"
                file={formData.idBack}
                onChange={(file) => {
                  setFormData({ ...formData, idBack: file });
                  setErrors({ ...errors, idBack: null });
                }}
                error={errors.idBack}
              />

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

              {/* Submit Button */}
              <button
                onClick={handleIDSubmit}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Continue to Selfie Verification'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Selfie Verification */}
        {step === 1 && (
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
              <FileUpload
                label="Take a Selfie"
                file={formData.selfie}
                onChange={(file) => {
                  setFormData({ ...formData, selfie: file });
                  setErrors({ ...errors, selfie: null });
                }}
                error={errors.selfie}
                capture="user"
                hint="Take a clear photo of your face"
              />

              {/* Selfie Tips */}
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
                    <span>Keep a neutral expression</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  disabled={uploading}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSelfieSubmit}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Submitted Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Thank you for submitting your verification documents. We'll review them and notify you within 24-48 hours.
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