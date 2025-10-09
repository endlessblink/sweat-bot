/**
 * Minimal Response Sanitizer
 * Only removes actual code/function syntax, trusts AI for everything else
 */

export class ResponseSanitizer {
  /**
   * Only check for actual function/code syntax that should never appear
   */
  static containsFunctionDefinition(response: string): boolean {
    if (!response || typeof response !== 'string') {
      return false;
    }

    // Only check for actual function syntax that would be an error
    const actualCodePatterns = [
      /function\s*=\s*\w+\s*\{/gi,    // function=name{
      /<function>/gi,                  // XML-like function tags
      /<<\/function>>/gi,              // Malformed tags
    ];

    return actualCodePatterns.some(pattern => pattern.test(response));
  }

  /**
   * Minimal cleanup - trust the AI's response
   */
  static cleanResponse(response: string, _context?: unknown): string {
    if (!response || typeof response !== 'string') {
      return response;
    }

    // Only remove actual function syntax if it somehow leaked through
    let cleaned = response;
    cleaned = cleaned.replace(/function\s*=\s*\w+\s*\{[^}]*\}/g, '');
    cleaned = cleaned.replace(/<\/?function>/g, '');
    cleaned = cleaned.replace(/<<\/function>>/g, '');
    
    // If we've removed everything (which should be rare), return the original
    // Trust the AI to generate good responses
    if (!cleaned.trim() && response.trim()) {
      return response; // Return original if cleaning removed everything
    }

    return cleaned.trim();
  }

  /**
   * Simple validation - trust the AI
   */
  static isResponseSafe(response: string): boolean {
    if (!response || typeof response !== 'string') {
      return false;
    }

    // Only block actual function syntax
    const dangerousPatterns = [
      'function=',
      '<function>',
      '<</',
    ];

    return !dangerousPatterns.some(pattern => response.includes(pattern));
  }
}

// Export convenience functions
export const sanitizeResponse = ResponseSanitizer.cleanResponse;
export const isResponseSafe = ResponseSanitizer.isResponseSafe;
export const containsFunctionDef = ResponseSanitizer.containsFunctionDefinition;
