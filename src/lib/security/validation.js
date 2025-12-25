// src/lib/security/validation.js - INPUT VALIDATION & SANITIZATION

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Nigerian format)
 */
export function isValidPhoneNumber(phone) {
  // Supports: +234, 0, or just digits
  const phoneRegex = /^(\+?234|0)?[789]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate amount (prevent negative values, SQL injection)
 */
export function validateAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0) {
    throw new Error('Invalid amount');
  }
  return num;
}

/**
 * Validate date (prevent invalid dates)
 */
export function validateDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date.toISOString();
}

/**
 * Validate file upload
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = /[<>:"\/\\|?*\x00-\x1f]/g;
  if (suspiciousPatterns.test(file.name)) {
    throw new Error('Invalid file name');
  }

  return true;
}

/**
 * Sanitize object for database insertion
 */
export function sanitizeObject(obj) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate booking data
 */
export function validateBookingData(data) {
  const errors = [];

  if (!data.client_id || !isValidUUID(data.client_id)) {
    errors.push('Invalid client ID');
  }

  if (!data.musician_id || !isValidUUID(data.musician_id)) {
    errors.push('Invalid musician ID');
  }

  if (!data.event_date) {
    errors.push('Event date is required');
  } else {
    try {
      validateDate(data.event_date);
    } catch (e) {
      errors.push('Invalid event date');
    }
  }

  if (data.amount !== undefined) {
    try {
      validateAmount(data.amount);
    } catch (e) {
      errors.push('Invalid amount');
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  return true;
}

/**
 * Validate message content
 */
export function validateMessage(content, maxLength = 1000) {
  if (!content || typeof content !== 'string') {
    throw new Error('Message content is required');
  }

  if (content.length > maxLength) {
    throw new Error(`Message must be less than ${maxLength} characters`);
  }

  // Check for suspicious patterns
  const suspiciousPatterns = /<script|javascript:|onerror=|onclick=/gi;
  if (suspiciousPatterns.test(content)) {
    throw new Error('Invalid message content');
  }

  return sanitizeInput(content);
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  check(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true; // Request allowed
  }

  reset(key) {
    this.requests.delete(key);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
