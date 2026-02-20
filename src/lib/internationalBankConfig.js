// src/lib/internationalBankConfig.js
export const INTERNATIONAL_BANK_REQUIREMENTS = {
  // ============================================
  // NIGERIA (Keep your existing Paystack flow)
  // ============================================
  NG: {
    name: 'Nigeria',
    currency: 'NGN',
    usePaystackVerification: true, // ✅ Keep your existing flow
    fields: [
      {
        name: 'bank_code',
        label: 'Bank',
        type: 'select',
        required: true,
        // Populated from your existing /api/banks endpoint
      },
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
    ],
  },

  // ============================================
  // UK - 8 DIGIT ACCOUNT + 6 DIGIT SORT CODE
  // ============================================
  GB: {
    name: 'United Kingdom',
    currency: 'GBP',
    usePaystackVerification: false,
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
        maxLength: 8,
        pattern: /^\d{2}-?\d{2}-?\d{2}$/,
        required: true,
        helpText: '6-digit sort code (format: XX-XX-XX)',
        format: (value) => {
          const cleaned = value.replace(/\D/g, '');
          const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,2})$/);
          if (match) {
            return [match[1], match[2], match[3]].filter(Boolean).join('-');
          }
          return value;
        },
      },
      {
        name: 'bank_name',
        label: 'Bank Name',
        placeholder: 'e.g., Barclays, HSBC, Lloyds',
        required: true,
      },
    ],
  },

  // ============================================
  // USA
  // ============================================
  US: {
    name: 'United States',
    currency: 'USD',
    usePaystackVerification: false,
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        placeholder: '123456789012',
        maxLength: 17,
        minLength: 4,
        pattern: /^\d{4,17}$/,
        required: true,
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
      {
        name: 'bank_name',
        label: 'Bank Name',
        placeholder: 'e.g., Chase, Bank of America',
        required: true,
      },
    ],
  },

  // ============================================
  // EUROPE (IBAN COUNTRIES)
  // ============================================
  DE: {
    name: 'Germany',
    currency: 'EUR',
    usePaystackVerification: false,
    fields: [
      {
        name: 'iban',
        label: 'IBAN',
        placeholder: 'DE89 3704 0044 0532 0130 00',
        maxLength: 34,
        pattern: /^DE\d{20}$/i,
        required: true,
        helpText: 'German IBAN (22 characters total)',
      },
      {
        name: 'swift_code',
        label: 'BIC/SWIFT Code',
        placeholder: 'DEUTDEFF',
        maxLength: 11,
        minLength: 8,
        pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i,
        required: false,
      },
      {
        name: 'bank_name',
        label: 'Bank Name',
        required: true,
      },
    ],
  },

  FR: {
    name: 'France',
    currency: 'EUR',
    usePaystackVerification: false,
    fields: [
      {
        name: 'iban',
        label: 'IBAN',
        placeholder: 'FR76 3000 6000 0112 3456 7890 189',
        maxLength: 34,
        pattern: /^FR\d{25}$/i,
        required: true,
      },
      {
        name: 'bank_name',
        label: 'Bank Name',
        required: true,
      },
    ],
  },

  // ============================================
  // OTHER AFRICAN COUNTRIES
  // ============================================
  GH: {
    name: 'Ghana',
    currency: 'GHS',
    usePaystackVerification: false,
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
      {
        name: 'bank_name',
        label: 'Bank Name',
        required: true,
      },
    ],
  },

  KE: {
    name: 'Kenya',
    currency: 'KES',
    usePaystackVerification: false,
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        maxLength: 13,
        required: true,
      },
      {
        name: 'bank_code',
        label: 'Bank Code',
        maxLength: 2,
        required: true,
      },
      {
        name: 'branch_code',
        label: 'Branch Code',
        maxLength: 3,
        required: true,
      },
      {
        name: 'bank_name',
        label: 'Bank Name',
        required: true,
      },
    ],
  },

  ZA: {
    name: 'South Africa',
    currency: 'ZAR',
    usePaystackVerification: false,
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        maxLength: 11,
        required: true,
      },
      {
        name: 'bank_code',
        label: 'Universal Branch Code',
        placeholder: '632005',
        maxLength: 6,
        minLength: 6,
        pattern: /^\d{6}$/,
        required: true,
      },
      {
        name: 'account_type',
        label: 'Account Type',
        type: 'select',
        options: [
          { value: 'current', label: 'Current/Cheque' },
          { value: 'savings', label: 'Savings' },
        ],
        required: true,
      },
      {
        name: 'bank_name',
        label: 'Bank Name',
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
    usePaystackVerification: false,
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        maxLength: 18,
        minLength: 9,
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
      {
        name: 'bank_name',
        label: 'Bank Name',
        required: true,
      },
    ],
  },

  // ============================================
  // OCEANIA
  // ============================================
  AU: {
    name: 'Australia',
    currency: 'AUD',
    usePaystackVerification: false,
    fields: [
      {
        name: 'account_number',
        label: 'Account Number',
        maxLength: 9,
        minLength: 5,
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
      {
        name: 'bank_name',
        label: 'Bank Name',
        required: true,
      },
    ],
  },

  // ============================================
  // DEFAULT (For unlisted countries)
  // ============================================
  DEFAULT: {
    name: 'International',
    currency: 'USD',
    usePaystackVerification: false,
    fields: [
      {
        name: 'iban',
        label: 'IBAN (if available)',
        placeholder: 'XX00 0000 0000 0000 0000 00',
        maxLength: 34,
        required: false,
      },
      {
        name: 'swift_code',
        label: 'SWIFT/BIC Code',
        placeholder: 'ABCDXXXX',
        maxLength: 11,
        minLength: 8,
        required: false,
      },
      {
        name: 'account_number',
        label: 'Account Number',
        required: true,
      },
      {
        name: 'bank_name',
        label: 'Bank Name',
        required: true,
      },
    ],
  },
};

export function getBankRequirements(countryCode) {
  return INTERNATIONAL_BANK_REQUIREMENTS[countryCode] || INTERNATIONAL_BANK_REQUIREMENTS.DEFAULT;
}

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