
Copy

// src/lib/passwordValidation.js
// Shared password rules — import this on both frontend and backend
// so the rules are always in sync

export const PASSWORD_RULES = [
  { id: "length",  label: "At least 8 characters",         test: (p) => p.length >= 8 },
  { id: "upper",   label: "One uppercase letter (A–Z)",     test: (p) => /[A-Z]/.test(p) },
  { id: "lower",   label: "One lowercase letter (a–z)",     test: (p) => /[a-z]/.test(p) },
  { id: "number",  label: "One number (0–9)",                test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#$…)",  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

/**
 * Validate a password against all rules.
 * Returns { valid: boolean, failed: string[] }
 */
export function validatePassword(password) {
  const failed = PASSWORD_RULES
    .filter((r) => !r.test(password))
    .map((r) => r.label);

  return { valid: failed.length === 0, failed };
}
