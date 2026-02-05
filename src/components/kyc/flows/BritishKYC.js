// src/components/kyc/flows/BritishKYC.js - COMPLETE BRITISH KYC FLOW
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKYC } from '@/hooks/useKYC';
import ProgressBar from '../shared/ProgressBar';
import FileUpload from '../shared/FileUpload';
import IDTypeSelector from '../shared/IDTypeSelector';
import RightToWork from '../steps/RightToWork';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const BRITISH_ID_TYPES = [
  { 
    value: 'passport', 
    label: 'British Passport', 
    icon: '🛂',
    description: 'UK Passport' 
  },
  { 
    value: 'drivers_license', 
    label: 'UK Driver\'s License', 
    icon: '🪪',
    description: 'Valid UK driving license' 
  }
];

const STEPS = ['ID Document', 'Right to Work', 'Selfie with ID', 'Complete'];

export default function BritishKYC({ country }) {
  const router = useRouter();
  const { submitVerification, uploading } = useKYC();
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    idType: 'passport',
    idNumber: '',
    idDocument: null,
    rightToWorkCode: '',
    dateOfBirth: '',
    selfieWithID: null
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const result = await submitVerification({
      country,
      isBritishCitizen: true,
      verificationType: 'british',
      ...formData
    });

    if (result.success) {
      setStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/musician/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Progress */}
        <ProgressBar currentStep={step} totalSteps={STEPS.length} steps={STEPS} />

        {/* Step 0: ID Document */}
        {step === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              British ID Document
            </h2>
            
            <div className="space-y-6">
              <IDTypeSelector
                options={BRITISH_ID_TYPES}
                selected={formData.idType}
                onChange={(value) => setFormData({...formData, idType: value})}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {formData.idType === 'passport' ? 'Passport Number' : 'License Number'}
                </label>
                <input
                  type="text"
                  placeholder={formData.idType === 'passport' ? 'Passport Number' : 'License Number'}
                  value={formData.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <FileUpload
                label="Upload ID Document"
                file={formData.idDocument}
                onChange={(file) => setFormData({...formData, idDocument: file})}
                hint="Clear photo or scan of your ID"
              />

              <button
                onClick={() => setStep(1)}
                disabled={!formData.idDocument || !formData.idNumber}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Right to Work */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Right to Work Verification
            </h2>
            
            <RightToWork
              shareCode={formData.rightToWorkCode}
              onShareCodeChange={(code) => setFormData({...formData, rightToWorkCode: code})}
              dateOfBirth={formData.dateOfBirth}
              onDateOfBirthChange={(dob) => setFormData({...formData, dateOfBirth: dob})}
              error={errors.rightToWorkCode}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(0)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-xl font-semibold hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.rightToWorkCode || !formData.dateOfBirth}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-semibold disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Selfie with ID */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Selfie Holding Your ID
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Take a clear photo of yourself holding your ID document next to your face
            </p>

            <FileUpload
              label="Take Selfie with ID"
              file={formData.selfieWithID}
              onChange={(file) => setFormData({...formData, selfieWithID: file})}
              capture="user"
              hint="Hold your ID next to your face and take a clear photo"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                disabled={uploading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 py-4 rounded-xl font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || !formData.selfieWithID}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              We'll review your documents within 24-48 hours
            </p>
            <button
              onClick={() => router.push('/musician/dashboard')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}