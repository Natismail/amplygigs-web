// src/components/kyc/KYCVerificationFlow.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKYC } from '@/hooks/useKYC';
import CountrySelector from './CountrySelector';
import NigerianKYC from './flows/NigerianKYC';
import BritishKYC from './flows/BritishKYC';
import InternationalKYC from './flows/InternationalKYC';
import VerificationStatus from './VerificationStatus';
import { Globe, Loader2 } from 'lucide-react';

export default function KYCVerificationFlow() {
  const router = useRouter();
  const { verification, loading, isVerified, isPending } = useKYC();
  
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isBritishCitizen, setIsBritishCitizen] = useState(null);
  const [flow, setFlow] = useState(null);

  // Determine flow based on selections
  useEffect(() => {
    if (!selectedCountry) return;

    if (selectedCountry === 'Nigeria') {
      setFlow('nigerian');
    } else if (selectedCountry === 'United Kingdom') {
      if (isBritishCitizen === null) return;
      setFlow(isBritishCitizen ? 'british' : 'international');
    } else {
      setFlow('international');
    }
  }, [selectedCountry, isBritishCitizen]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Show verification status if already verified or pending
  if (isVerified || isPending) {
    return <VerificationStatus 
      status={isVerified ? 'verified' : 'pending'} 
      verification={verification}
    />;
  }

  // Country selection step
  if (!selectedCountry) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome to KYC Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Let's get you verified to start receiving gigs worldwide
            </p>
          </div>

          <CountrySelector 
            onSelectCountry={(country) => {
              setSelectedCountry(country);
              if (country === 'Nigeria') {
                setFlow('nigerian');
              }
            }}
          />
        </div>
      </div>
    );
  }

  // UK citizenship question
  if (selectedCountry === 'United Kingdom' && isBritishCitizen === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => {
              setSelectedCountry(null);
              setIsBritishCitizen(null);
            }}
            className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            ← Back to country selection
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🇬🇧</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Are you a British Citizen?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This helps us determine the right verification process for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setIsBritishCitizen(true)}
                className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600">
                  Yes, I'm a British Citizen
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  British passport or driver's license
                </p>
              </button>

              <button
                onClick={() => setIsBritishCitizen(false)}
                className="p-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600">
                  No, I'm an International Resident
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Foreign passport + visa/permit
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate KYC flow
  return (
    <>
      {flow === 'nigerian' && <NigerianKYC country={selectedCountry} />}
      {flow === 'british' && <BritishKYC country={selectedCountry} />}
      {flow === 'international' && (
        <InternationalKYC 
          country={selectedCountry} 
          isBritishCitizen={isBritishCitizen}
        />
      )}
    </>
  );
}