// src/lib/bankAccountConfig.js

export const BANK_ACCOUNT_REQUIREMENTS = {
  // ============================================
  // EUROPE
  // ============================================
  GB: {
    name: 'United Kingdom',
    currency: 'GBP',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '12345678',
        maxLength: 8,
        minLength: 8,
        pattern: /^\d{8}$/,
        required: true,
        helpText: 'Your 8-digit UK bank account number',
      },
      {
        name: 'sort_code',
        label: 'Sort Code',
        placeholder: '12-34-56',
        maxLength: 8, // Includes hyphens
        pattern: /^\d{2}-\d{2}-\d{2}$/,
        required: true,
        helpText: '6-digit sort code in format XX-XX-XX',
        format: (value) => {
          // Auto-format as user types
          const cleaned = value.replace(/\D/g, '');
          const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,2})$/);
          if (match) {
            return [match[1], match[2], match[3]].filter(Boolean).join('-');
          }
          return value;
        },
      },
    ],
  },

  // ============================================
  // EUROPE - IBAN COUNTRIES
  // ============================================
  DE: { // Germany
    name: 'Germany',
    currency: 'EUR',
    fields: [
      {
        name: 'iban',
        label: 'IBAN',
        placeholder: 'DE89 3704 0044 0532 0130 00',
        maxLength: 34,
        pattern: /^DE\d{2}[A-Z0-9]{18}$/i,
        required: true,
        helpText: 'German IBAN (22 characters)',
      },
      {
        name: 'swift_code',
        label: 'BIC/SWIFT Code',
        placeholder: 'DEUTDEFF',
        maxLength: 11,
        pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
        required: false,
        helpText: 'Bank Identifier Code (8 or 11 characters)',
      },
    ],
  },

  FR: { // France
    name: 'France',
    currency: 'EUR',
    fields: [
      {
        name: 'iban',
        label: 'IBAN',
        placeholder: 'FR76 3000 6000 0112 3456 7890 189',
        maxLength: 34,
        pattern: /^FR\d{2}[A-Z0-9]{23}$/i,
        required: true,
        helpText: 'French IBAN (27 characters)',
      },
      {
        name: 'swift_code',
        label: 'BIC/SWIFT Code',
        placeholder: 'BNPAFRPP',
        maxLength: 11,
        required: false,
      },
    ],
  },

  // ============================================
  // NORTH AMERICA
  // ============================================
  US: {
    name: 'United States',
    currency: 'USD',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '123456789012',
        maxLength: 17,
        minLength: 4,
        pattern: /^\d{4,17}$/,
        required: true,
        helpText: 'Your US bank account number (4-17 digits)',
      },
      {
        name: 'routing_number',
        label: 'Routing Number (ABA)',
        placeholder: '123456789',
        maxLength: 9,
        minLength: 9,
        pattern: /^\d{9}$/,
        required: true,
        helpText: '9-digit routing number',
      },
      {
        name: 'account_type',
        label: 'Account Type',
        type: 'select',
        options: [
          { value: 'checking', label: 'Checking' },
          { value: 'savings', label: 'Savings' },
        ],
        required: true,
      },
    ],
  },

  CA: {
    name: 'Canada',
    currency: 'CAD',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '1234567',
        maxLength: 12,
        minLength: 7,
        pattern: /^\d{7,12}$/,
        required: true,
      },
      {
        name: 'transit_number',
        label: 'Transit Number',
        placeholder: '12345',
        maxLength: 5,
        minLength: 5,
        pattern: /^\d{5}$/,
        required: true,
        helpText: '5-digit branch transit number',
      },
      {
        name: 'institution_number',
        label: 'Institution Number',
        placeholder: '123',
        maxLength: 3,
        minLength: 3,
        pattern: /^\d{3}$/,
        required: true,
        helpText: '3-digit bank institution number',
      },
    ],
  },

  // ============================================
  // AFRICA
  // ============================================
  NG: {
    name: 'Nigeria',
    currency: 'NGN',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '0123456789',
        maxLength: 10,
        minLength: 10,
        pattern: /^\d{10}$/,
        required: true,
        helpText: '10-digit NUBAN account number',
      },
      {
        name: 'bank_code',
        label: 'Bank',
        type: 'select',
        required: true,
        helpText: 'Select your bank',
        // Populated dynamically from Paystack banks API
      },
    ],
  },

  GH: {
    name: 'Ghana',
    currency: 'GHS',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '1234567890123',
        maxLength: 13,
        pattern: /^\d{10,13}$/,
        required: true,
      },
      {
        name: 'bank_code',
        label: 'Bank Code',
        placeholder: '280100',
        maxLength: 6,
        required: true,
      },
    ],
  },

  KE: {
    name: 'Kenya',
    currency: 'KES',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '1234567890',
        maxLength: 13,
        required: true,
      },
      {
        name: 'bank_code',
        label: 'Bank Code',
        placeholder: '01',
        maxLength: 2,
        required: true,
      },
      {
        name: 'branch_code',
        label: 'Branch Code',
        placeholder: '001',
        maxLength: 3,
        required: true,
      },
    ],
  },

  ZA: {
    name: 'South Africa',
    currency: 'ZAR',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '1234567890',
        maxLength: 11,
        required: true,
      },
      {
        name: 'bank_code',
        label: 'Bank Code',
        placeholder: '632005',
        maxLength: 6,
        minLength: 6,
        pattern: /^\d{6}$/,
        required: true,
        helpText: '6-digit universal branch code',
      },
      {
        name: 'account_type',
        label: 'Account Type',
        type: 'select',
        options: [
          { value: 'current', label: 'Current/Cheque' },
          { value: 'savings', label: 'Savings' },
          { value: 'transmission', label: 'Transmission' },
        ],
        required: true,
      },
    ],
  },

  // ============================================
  // ASIA
  // ============================================
  IN: {
    name: 'India',
    currency: 'INR',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '12345678901234',
        maxLength: 18,
        minLength: 9,
        pattern: /^\d{9,18}$/,
        required: true,
      },
      {
        name: 'ifsc_code',
        label: 'IFSC Code',
        placeholder: 'SBIN0001234',
        maxLength: 11,
        minLength: 11,
        pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
        required: true,
        helpText: '11-character IFSC code',
      },
    ],
  },

  // ============================================
  // OCEANIA
  // ============================================
  AU: {
    name: 'Australia',
    currency: 'AUD',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '123456789',
        maxLength: 9,
        minLength: 5,
        pattern: /^\d{5,9}$/,
        required: true,
      },
      {
        name: 'bsb_number',
        label: 'BSB Number',
        placeholder: '123-456',
        maxLength: 7,
        pattern: /^\d{3}-?\d{3}$/,
        required: true,
        helpText: '6-digit Bank-State-Branch number',
        format: (value) => {
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length >= 3) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
          }
          return cleaned;
        },
      },
    ],
  },

  NZ: {
    name: 'New Zealand',
    currency: 'NZD',
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '12-3456-1234567-00',
        maxLength: 20,
        pattern: /^\d{2}-\d{4}-\d{7}-\d{2,3}$/,
        required: true,
        helpText: 'Format: BB-BBBB-AAAAAAA-SS',
      },
    ],
  },

  // ============================================
  // DEFAULT (For countries not listed)
  // ============================================
  DEFAULT: {
    name: 'International',
    currency: 'USD',
    fields: [
      {
        name: 'iban',
        label: 'IBAN (if available)',
        placeholder: 'XX00 0000 0000 0000 0000 00',
        maxLength: 34,
        required: false,
        helpText: 'International Bank Account Number',
      },
      {
        name: 'swift_code',
        label: 'SWIFT/BIC Code',
        placeholder: 'ABCDXXXX',
        maxLength: 11,
        minLength: 8,
        pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
        required: true,
        helpText: 'Bank Identifier Code (8 or 11 characters)',
      },
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: 'Your account number',
        required: true,
      },
    ],
  },
};

// Helper function to get requirements for a country
export function getBankRequirements(countryCode) {
  return BANK_ACCOUNT_REQUIREMENTS[countryCode] || BANK_ACCOUNT_REQUIREMENTS.DEFAULT;
}

// Validate account number based on country
export function validateBankAccount(countryCode, accountData) {
  const requirements = getBankRequirements(countryCode);
  const errors = {};

  requirements.fields.forEach((field) => {
    const value = accountData[field.name];

    if (field.required && !value) {
      errors[field.name] = `${field.label} is required`;
      return;
    }

    if (value && field.pattern && !field.pattern.test(value)) {
      errors[field.name] = `Invalid ${field.label} format`;
    }

    if (value && field.minLength && value.length < field.minLength) {
      errors[field.name] = `${field.label} must be at least ${field.minLength} characters`;
    }

    if (value && field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `${field.label} must not exceed ${field.maxLength} characters`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}