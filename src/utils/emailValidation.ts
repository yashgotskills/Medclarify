// Common disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'temp-mail.org',
  'yopmail.com',
  'throwaway.email',
  'getnada.com',
  'maildrop.cc',
  '33mail.com',
  'trashmail.com',
  'dispostable.com',
  'spamgourmet.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  'cookmail.info',
  'email60.com',
  'emailias.com',
  'hide.biz.st',
  'mytrashmail.com',
  'shieldedmail.com',
  'spamavert.com',
  'tempinbox.com',
  'tempmailaddress.com',
  'tempymail.com',
  'thankyou2010.com',
  'trbvm.com',
  'wegwerfmail.de',
  'zehnminutenmail.de'
];

// Suspicious patterns that might indicate fake emails
const SUSPICIOUS_PATTERNS = [
  /^[a-z]+\d{4,}@/i, // Simple name followed by many numbers
  /^test\d*@/i,      // Starts with "test"
  /^fake\d*@/i,      // Starts with "fake"
  /^spam\d*@/i,      // Starts with "spam"
  /^temp\d*@/i,      // Starts with "temp"
  /^demo\d*@/i,      // Starts with "demo"
  /^admin\d*@/i,     // Starts with "admin"
  /^null\d*@/i,      // Starts with "null"
  /^noreply\d*@/i,   // Starts with "noreply"
  /^\d{10,}@/,       // Only numbers (10+ digits)
  /^[a-z]{1,2}@/i,   // Very short usernames (1-2 chars)
];

// Trusted email domains (major providers)
const TRUSTED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'live.com',
  'msn.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'fastmail.com'
];

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number; // 0-100, higher = more risky
}

export function validateEmail(email: string): EmailValidationResult {
  const result: EmailValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    riskScore: 0
  };

  if (!email || typeof email !== 'string') {
    result.isValid = false;
    result.errors.push('Email is required');
    result.riskScore = 100;
    return result;
  }

  const trimmedEmail = email.toLowerCase().trim();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    result.isValid = false;
    result.errors.push('Invalid email format');
    result.riskScore += 50;
  }

  // Extract domain
  const domain = trimmedEmail.split('@')[1];
  if (!domain) {
    result.isValid = false;
    result.errors.push('Invalid email domain');
    result.riskScore = 100;
    return result;
  }

  // Check for disposable email domains
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    result.isValid = false;
    result.errors.push('Disposable email addresses are not allowed');
    result.riskScore = 100;
    return result;
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedEmail)) {
      result.warnings.push('Email pattern appears suspicious');
      result.riskScore += 30;
      break;
    }
  }

  // Check if domain is trusted
  if (TRUSTED_DOMAINS.includes(domain)) {
    result.riskScore = Math.max(0, result.riskScore - 20);
  } else {
    // Unknown domain increases risk slightly
    result.riskScore += 10;
  }

  // Additional validations
  const username = trimmedEmail.split('@')[0];
  
  // Check for extremely long usernames
  if (username.length > 30) {
    result.warnings.push('Unusually long email username');
    result.riskScore += 15;
  }

  // Check for consecutive dots or special characters
  if (/\.{2,}/.test(trimmedEmail) || /[+]{2,}/.test(trimmedEmail)) {
    result.warnings.push('Email contains suspicious character patterns');
    result.riskScore += 20;
  }

  // Check for too many numbers
  const numberCount = (trimmedEmail.match(/\d/g) || []).length;
  if (numberCount > username.length * 0.7) {
    result.warnings.push('Email contains unusually many numbers');
    result.riskScore += 15;
  }

  // Final risk assessment
  if (result.riskScore >= 70) {
    result.isValid = false;
    result.errors.push('Email appears to be fake or suspicious');
  } else if (result.riskScore >= 40) {
    result.warnings.push('Email may be risky - please verify carefully');
  }

  return result;
}

export function isEmailTrusted(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  return TRUSTED_DOMAINS.includes(domain);
}

export function formatValidationErrors(result: EmailValidationResult): string {
  const messages = [...result.errors, ...result.warnings];
  return messages.join('. ');
}