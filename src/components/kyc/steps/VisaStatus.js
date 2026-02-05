// src/components/kyc/steps/VisaStatus.js
"use client";

import FileUpload from '../shared/FileUpload';
import { Plane, AlertCircle } from 'lucide-react';

const VISA_TYPES = [
  { value: 'work_visa', label: 'Work Visa / Permit' },
  { value: 'student_visa', label: 'Student Visa (with work rights)' },
  { value: 'permanent_resident', label: 'Permanent Resident' },
  { value: 'spouse_visa', label: 'Spouse/Partner Visa' },
  { value: 'tier_1', label: 'Tier 1 Visa (UK)' },
  { value: 'tier_2', label: 'Tier 2 Visa (UK)' },
  { value: 'other', label: 'Other (specify below)' },
];

export default function VisaStatus({ 
  visaType,
  onVisaTypeChange,
  visaDetails,
  onVisaDetailsChange,
  visaDocument,
  onVisaDocumentChange,
  error
}) {
  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
        <div className="flex gap-3">
          <Plane className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Visa & Immigration Status
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              We need to verify your legal right to work in your country of residence.
            </p>
          </div>
        </div>
      </div>

      {/* Visa Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Visa/Immigration Status <span className="text-red-500">*</span>
        </label>
        <select
          value={visaType}
          onChange={(e) => onVisaTypeChange(e.target.value)}
          className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Select your visa type...</option>
          {VISA_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Details */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Additional Information
        </label>
        <textarea
          value={visaDetails}
          onChange={(e) => onVisaDetailsChange(e.target.value)}
          placeholder="Please provide any relevant details about your visa status, expiry date, or work restrictions..."
          rows={4}
          className="w-full p-3.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Example: "Work Visa valid until Dec 2025, no restrictions on self-employment"
        </p>
      </div>

      {/* Visa Document Upload */}
      <FileUpload
        label="Upload Visa/Immigration Document"
        file={visaDocument}
        onChange={onVisaDocumentChange}
        error={error}
        hint="Photo or scan of your visa page or residence permit"
      />

      {/* Important Note */}
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
              Important
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200">
              Ensure your visa/permit allows you to work as a self-employed musician or freelancer. 
              Some visas have restrictions on self-employment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}