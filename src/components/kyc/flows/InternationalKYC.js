// src/components/kyc/flows/InternationalKYC.js - COMPLETE INTERNATIONAL KYC FLOW
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKYC } from '@/hooks/useKYC';
import ProgressBar from '../shared/ProgressBar';
import FileUpload from '../shared/FileUpload';
import VisaStatus from '../steps/VisaStatus';
import AddressVerification from '../steps/AddressVerification';
import RightToWork from '../steps/RightToWork';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const STEPS_INTERNATIONAL = ['ID Document', 'Visa Status', 'Proof of Address', 'Selfie', 'Complete'];
const STEPS_UK = ['ID Document', 'Visa Status', 'Proof of Address', 'Right to Work', 'Selfie', 'Complete'];

export default function InternationalKYC({ country, isBritishCitizen }) {
  const router = useRouter();
  const { submitVerification, uploading } = useKYC();
  
  const isUKResident = country === 'United Kingdom';
  const steps = isUKResident ? STEPS_UK : STEPS_INTERNATIONAL;
  
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    idType: 'passport',
    idNumber: '',
    idDocument: null,
    visaType: '',
    visaDetails: '',
    visaDocument: null,
    proofOfAddressType: '',
    proofOfAddress: null,
    rightToWorkCode: '',
    dateOfBirth: '',
    selfie: null
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const result = await submitVerification({
      country,
      isBritishCitizen,
      verificationType: 'international',
      ...formData
    });

    if (result.success) {
      setStep(steps.length - 1);
    }
  };

  // Determine which step is which based on UK or not
  const addressStep = 2;
  const rightToWorkStep = isUKResident ? 3 : null;
  const selfieStep = isUKResident ? 4 : 3;
  const completeStep = isUKResident ? 5 : 4;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/musician/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Progress */}
        <ProgressBar currentStep={step} totalSteps={steps.length} steps={steps} />

        {/* Step 0: ID Document */}
        {step === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">ID Document</h2>
            
            <div className="space-y-6">
              <input
                type="text"
                placeholder="Passport Number"
                value={formData.idNumber}
                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                className="w-full p-3 border rounded-xl"
              />

              <FileUpload
                label="Upload Passport/ID"
                file={formData.idDocument}
                onChange={(file) => setFormData({...formData, idDocument: file})}
              />

              <button
                onClick={() => setStep(1)}
                disabled={!formData.idDocument || !formData.idNumber}
                className="w-full bg-purple-600 text-white py-4 rounded-xl disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Visa Status */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Visa & Immigration Status</h2>
            
            <VisaStatus
              visaType={formData.visaType}
              onVisaTypeChange={(type) => setFormData({...formData, visaType: type})}
              visaDetails={formData.visaDetails}
              onVisaDetailsChange={(details) => setFormData({...formData, visaDetails: details})}
              visaDocument={formData.visaDocument}
              onVisaDocumentChange={(file) => setFormData({...formData, visaDocument: file})}
              error={errors.visaDocument}
            />

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(0)} className="flex-1 bg-gray-200 py-3 rounded-xl">
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.visaType || !formData.visaDocument}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Proof of Address */}
        {step === addressStep && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Proof of Address</h2>
            
            <AddressVerification
              proofType={formData.proofOfAddressType}
              onProofTypeChange={(type) => setFormData({...formData, proofOfAddressType: type})}
              proofFile={formData.proofOfAddress}
              onFileChange={(file) => setFormData({...formData, proofOfAddress: file})}
              error={errors.proofOfAddress}
            />

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-200 py-3 rounded-xl">
                Back
              </button>
              <button
                onClick={() => setStep(isUKResident ? 3 : 3)}
                disabled={!formData.proofOfAddressType || !formData.proofOfAddress}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Right to Work (UK only) */}
        {isUKResident && step === rightToWorkStep && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Right to Work (UK)</h2>
            
            <RightToWork
              shareCode={formData.rightToWorkCode}
              onShareCodeChange={(code) => setFormData({...formData, rightToWorkCode: code})}
              dateOfBirth={formData.dateOfBirth}
              onDateOfBirthChange={(dob) => setFormData({...formData, dateOfBirth: dob})}
              error={errors.rightToWorkCode}
            />

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 bg-gray-200 py-3 rounded-xl">
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.rightToWorkCode || !formData.dateOfBirth}
                className="flex-1 bg-purple-600 text-white py-3 rounded-xl disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step: Selfie */}
        {step === selfieStep && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Selfie Verification</h2>
            
            <FileUpload
              label="Take a Selfie"
              file={formData.selfie}
              onChange={(file) => setFormData({...formData, selfie: file})}
              capture="user"
            />

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setStep(isUKResident ? 3 : 2)} 
                className="flex-1 bg-gray-200 py-3 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || !formData.selfie}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl disabled:opacity-50"
              >
                {uploading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === completeStep && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-24 h-24 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Submitted!</h2>
            <p className="mb-8">We'll review within 24-48 hours</p>
            <button
              onClick={() => router.push('/musician/dashboard')}
              className="bg-purple-600 text-white px-8 py-4 rounded-xl"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}