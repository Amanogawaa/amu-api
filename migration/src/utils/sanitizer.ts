/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sanitizes a string to be safe for use as a file or directory name
 * Removes path traversal attempts and invalid filename characters
 * @param input - String to sanitize
 * @returns Sanitized string safe for filesystem use
 */
export const sanitizePathComponent = (input: string): string => {
  if (!input) return "";
  return input
    .replace(/\.\./g, "") // Remove path traversal attempts
    .replace(/[/\\:*?"<>|]/g, "_") // Replace invalid filename characters
    .trim();
};

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * Removes potentially dangerous characters and HTML
 * @param input - String to sanitize
 * @returns Sanitized string safe for database queries and display
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  return (
    input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove script content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove SQL injection attempts
      .replace(
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        "",
      )
      // Remove NoSQL injection attempts
      .replace(/[${}]/g, "")
      // Limit length to prevent DoS
      .substring(0, 10000)
  );
};

/**
 * Sanitizes search queries for Firestore safe usage
 * @param query - Search query string
 * @returns Sanitized query string
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return "";

  return (
    sanitizeInput(query)
      // Remove special Firestore characters that could cause issues
      .replace(/[\\]/g, "")
      // Limit search query length
      .substring(0, 500)
  );
};

/**
 * Sanitizes email input
 * @param email - Email address to sanitize
 * @returns Sanitized email address
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return "";

  return (
    email
      .trim()
      .toLowerCase()
      // Remove any characters that aren't valid in email addresses
      .replace(/[^a-z0-9@._+-]/g, "")
      // Limit length
      .substring(0, 254)
  ); // RFC 5321 max email length
};

/**
 * Sanitizes numeric input
 * @param input - String or number to sanitize
 * @returns Number or NaN if invalid
 */
export const sanitizeNumber = (input: string | number): number => {
  const num = Number(input);
  return Number.isFinite(num) ? num : Number.NaN;
};

/**
 * Sanitizes boolean input
 * @param input - Value to convert to boolean
 * @returns Boolean value
 */
export const sanitizeBoolean = (input: any): boolean => {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") {
    return input.toLowerCase() === "true" || input === "1";
  }
  return Boolean(input);
};

/**
 * Sanitizes URL input
 * @param url - URL string to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return "";

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return "";
    }
    return urlObj.toString();
  } catch {
    return "";
  }
};

/**
 * Sanitizes array input
 * @param input - Array to sanitize
 * @param maxLength - Maximum allowed array length
 * @returns Sanitized array
 */
export const sanitizeArray = <T>(input: any, maxLength = 1000): T[] => {
  if (!Array.isArray(input)) return [];
  return input.slice(0, maxLength);
};

/**
 * Sanitizes object keys to prevent prototype pollution
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
): Partial<T> => {
  if (!obj || typeof obj !== "object") return {};

  const sanitized: any = {};
  const dangerousKeys = ["__proto__", "constructor", "prototype"];

  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      !dangerousKeys.includes(key)
    ) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
};
