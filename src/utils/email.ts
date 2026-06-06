/**
 * Email and authentication utility functions
 */

/**
 * Check if an email is in the allowed list
 */
export function isEmailAllowed(email: string, allowedEmails: string | undefined): boolean {
  if (!allowedEmails) {
    return false;
  }

  try {
    const allowedList = allowedEmails.split(',').map((e) => e.trim().toLowerCase());
    return allowedList.includes(email.toLowerCase());
  } catch {
    return false;
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
  if (!userCredentials) {
    return false;
  }

  try {
    const credentialsList = userCredentials.split(',').map((cred) => {
      const parts = cred.trim().split(':');
      if (parts.length !== 2) {
        return { username: '', password: '' };
      }
      const [user, pass] = parts;
      return { username: user, password: pass };
    });

    return credentialsList.some(
      (cred) => cred.username === username && cred.password === password
    );
  } catch {
    return false;
  }
}
