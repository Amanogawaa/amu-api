/**
 * Input sanitization utilities for secure file and path handling
 */

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
