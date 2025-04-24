/**
 * Email and authentication utility functions
 */

/**
 * Check if an email is in the allowed list
 */
export function isEmailAllowed(email: string, allowedEmails: string | undefined): boolean {
  // If allowedEmails is undefined or empty, deny access in production
  if (!allowedEmails) {
    console.warn('ALLOWED_EMAILS environment variable is not defined. Denying access.');
    return false;
  }

  try {
    const allowedList = allowedEmails.split(',').map(e => e.trim().toLowerCase());
    return allowedList.includes(email.toLowerCase());
  } catch (error) {
    console.error('Error parsing ALLOWED_EMAILS:', error);
    // In case of error, deny access for security
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
  // If userCredentials is undefined or empty, deny access in production
  if (!userCredentials) {
    console.warn('USER_CREDENTIALS environment variable is not defined. Denying access.');
    return false;
  }

  console.log(`Verifying credentials for username: ${username}`);
  console.log(`USER_CREDENTIALS value: ${userCredentials}`);

  try {
    // Parse credentials in format "username1:password1,username2:password2"
    const credentialsList = userCredentials.split(',').map(cred => {
      const parts = cred.trim().split(':');
      if (parts.length !== 2) {
        console.error(`Invalid credential format: ${cred}`);
        return { username: '', password: '' };
      }
      const [user, pass] = parts;
      console.log(`Parsed credential: username=${user}, password=${pass ? 'REDACTED' : 'undefined'}`);
      return { username: user, password: pass };
    });

    console.log(`Parsed ${credentialsList.length} credentials`);

    // Check if username and password match any credentials
    const isValid = credentialsList.some(
      cred => cred.username === username && cred.password === password
    );

    console.log(`Credential validation result: ${isValid}`);
    return isValid;
  } catch (error) {
    console.error('Error parsing USER_CREDENTIALS:', error);
    return false;
  }
}


