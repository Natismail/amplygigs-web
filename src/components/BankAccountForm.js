// src/components/BankAccountForm.js
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBankRequirements, validateBankAccount } from '@/lib/bankAccountConfig';
import { Building2, Check, AlertCircle } from 'lucide-react';

export default function BankAccountForm({ onSuccess, onCancel }) {
  const { user } = useAuth();
  
  const [countryCode, setCountryCode] = useState(user?.country_code || 'NG');
  const [requirements, setRequirements] = useState(getBankRequirements(countryCode));
  const [formData, setFormData] = useState({
    account_holder_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
    bank_name: '',
  });
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load banks list for Nigeria (Paystack)
  useEffect(() => {
    if (countryCode === 'NG') {
      fetchNigerianBanks();
    }
  }, [countryCode]);

  // Update requirements when country changes
  useEffect(() => {
    setRequirements(getBankRequirements(countryCode));
    setFormData(prev => ({
      account_holder_name: prev.account_holder_name,
      bank_name: '',
    }));
    setErrors({});
  }, [countryCode]);

  const fetchNigerianBanks = async () => {
    try {
      const response = await fetch('/api/banks/nigeria');
      const data = await response.json();
      if (data.banks) {
        setBanks(data.banks);
      }
    } catch (error) {
      console.error('Failed to fetch banks:', error);
    }
  };

  const handleInputChange = (fieldName, value) => {
    const field = requirements.fields.find(f => f.name === fieldName);
    
    // Apply formatting if available
    const formattedValue = field?.format ? field.format(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: formattedValue,
    }));

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validation = validateBankAccount(countryCode, formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bank-accounts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          country_code: countryCode,
          currency: requirements.currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bank account');
      }

      alert('✅ Bank account added successfully!');
      if (onSuccess) onSuccess(data.account);
    } catch (error) {
      console.error('Add bank account error:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    if (field.type === 'select') {
      // Special handling for Nigerian banks
      if (field.name === 'bank_code' && countryCode === 'NG') {
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => {
                const selectedBank = banks.find(b => b.code === e.target.value);
                handleInputChange('bank_code', e.target.value);
                if (selectedBank) {
                  setFormData(prev => ({ ...prev, bank_name: selectedBank.name }));
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              required={field.required}
            >
              <option value="">Select your bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.helpText}</p>
            )}
            {error && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        );
      }

      // Regular select field
      return (
        <div key={field.name} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );
    }

    // Text input
    return (
      <div key={field.name} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
          }`}
          required={field.required}
        />
        {field.helpText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
          <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add Bank Account
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {requirements.name} • {requirements.currency}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Account Holder Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Account Holder Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.account_holder_name}
            onChange={(e) => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            required
          />
        </div>

        {/* Dynamic Fields */}
        {requirements.fields.map(renderField)}

        {/* Submit Error */}
        {errors.submit && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.submit}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Adding...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Add Account
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}