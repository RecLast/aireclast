/**
 * Email and authentication utility functions
 */

/**
 * Check if an email is in the allowed list
 */
export function isEmailAllowed(email: string, allowedEmails: string | undefined): boolean {
  // If allowedEmails is undefined or empty, allow all emails in development
  if (!allowedEmails) {
    console.warn('ALLOWED_EMAILS environment variable is not defined. Allowing all emails.');
    return true;
  }

  try {
    const allowedList = allowedEmails.split(',').map(e => e.trim().toLowerCase());
    return allowedList.includes(email.toLowerCase());
  } catch (error) {
    console.error('Error parsing ALLOWED_EMAILS:', error);
    // In case of error, allow the email to prevent blocking legitimate users
    return true;
  }
}

/**
 * Verify username and password against stored credentials
 */
export function verifyCredentials(
  username: string,
  password: string,
  userCredentials: string | undefined
): boolean {
  // If userCredentials is undefined or empty, deny access in production
  if (!userCredentials) {
    console.warn('USER_CREDENTIALS environment variable is not defined. Denying access.');
    return false;
  }

  try {
    // Parse credentials in format "username1:password1,username2:password2"
    const credentialsList = userCredentials.split(',').map(cred => {
      const [user, pass] = cred.trim().split(':');
      return { username: user, password: pass };
    });

    // Check if username and password match any credentials
    return credentialsList.some(
      cred => cred.username === username && cred.password === password
    );
  } catch (error) {
    console.error('Error parsing USER_CREDENTIALS:', error);
    return false;
  }
}


