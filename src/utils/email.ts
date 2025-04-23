/**
 * Email utility functions
 */

/**
 * Generate a random verification code
 */
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    code += digits[randomIndex];
  }
  
  return code;
}

/**
 * Check if an email is in the allowed list
 */
export function isEmailAllowed(email: string, allowedEmails: string): boolean {
  const allowedList = allowedEmails.split(',').map(e => e.trim().toLowerCase());
  return allowedList.includes(email.toLowerCase());
}

/**
 * Send a verification code email (mock implementation)
 * 
 * In a real implementation, you would use Cloudflare Email Workers or another email service
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // In a real implementation, you would send an actual email
  console.log(`Sending verification code ${code} to ${email}`);
  
  // For demo purposes, we'll just log the code and return success
  // In a production environment, you would integrate with an email service
  return true;
}
