// Security utilities for AmplyGigs

import crypto from 'crypto';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .substring(0, 5000); // Limit length
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Nigerian format)
 */
export function validatePhone(phone) {
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Hash sensitive data before logging
 */
export function hashForLogging(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 8);
}

/**
 * Rate limiting check (simple in-memory)
 */
const requestCounts = new Map();

export function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier) || [];
  
  // Remove old requests outside window
  const validRequests = userRequests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  requestCounts.set(identifier, validRequests);
  return true;
}

/**
 * Validate payment webhook signature (Paystack)
 */
export function verifyPaystackSignature(payload, signature) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
}

/**
 * Validate payment webhook signature (Stripe)
 */
// export function verifyStripeSignature(payload, signature) {
//   const hash = crypto
//     .createHmac('sha512', process.env.STRIPE_SECRET_KEY)
//     .update(JSON.stringify(payload))
//     .digest('hex');
  
//   return hash === signature;
// }

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for display
 */
export function maskEmail(email) {
  const [username, domain] = email.split('@');
  return `${username.substring(0, 2)}***@${domain}`;
}

export function maskPhone(phone) {
  return `***${phone.slice(-4)}`;
}

export function maskCardNumber(cardNumber) {
  return `****-****-****-${cardNumber.slice(-4)}`;
}


