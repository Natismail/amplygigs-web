// src/components/kyc/steps/AddressVerification.js
"use client";

import { useState } from 'react';
import FileUpload from '../shared/FileUpload';
import IDTypeSelector from '../shared/IDTypeSelector';
import { Home, FileText } from 'lucide-react';

const ADDRESS_PROOF_TYPES = [
  { 
    value: 'utility_bill', 
    label: 'Utility Bill', 
    icon: '💡',
    description: 'Gas, electricity, or water bill' 
  },
  { 
    value: 'bank_statement', 
    label: 'Bank Statement', 
    icon: '🏦',
    description: 'Bank or credit card statement' 
  },
  { 
    value: 'rent_agreement', 
    label: 'Rent Agreement', 
    icon: '📄',
    description: 'Tenancy or rental agreement' 
  },
  { 
    value: 'council_tax', 
    label: 'Council Tax Bill', 
    icon: '🏛️',
    description: 'Council tax statement (UK)' 
  },
];

export default function AddressVerification({ 
  proofType, 
  onProofTypeChange,
  proofFile,
  onFileChange,
  error
}) {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-4">
        <div className="flex gap-3">
          <Home className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Proof of Address Required
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Upload a document that shows your current residential address.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Document must be dated within the <strong>last 3 months</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Select Document Type
        </label>
        <IDTypeSelector
          options={ADDRESS_PROOF_TYPES}
          selected={proofType}
          onChange={onProofTypeChange}
        />
      </div>

      {/* File Upload */}
      <FileUpload
        label="Upload Proof of Address"
        file={proofFile}
        onChange={onFileChange}
        error={error}
        hint="Clear photo or scan showing your full name and address"
      />

      {/* Tips */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Requirements
        </h4>
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Must show your full name and current address</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Issued within the last 3 months</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Clear and legible (not blurry or cut off)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Official document from recognized provider</span>
          </li>
        </ul>
      </div>
    </div>
  );
}