/**
 * Login page JavaScript
 */

function initLoginPage() {
  const emailForm = document.getElementById('email-form');
  const credentialsForm = document.getElementById('credentials-form');
  const emailContainer = document.querySelector('.email-container');
  const credentialsContainer = document.querySelector('.credentials-container');
  const emailInput = document.getElementById('email');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const backToEmailButton = document.getElementById('back-to-email');

  let currentEmail = '';

  // Handle email form submission
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();

      if (!email) {
        app.showAlert('Please enter your email address', 'error');
        return;
      }

      // Disable form
      emailInput.disabled = true;
      emailForm.querySelector('button').disabled = true;

      try {
        // Check if email is allowed
        const response = await app.apiRequest('auth/check-email', 'POST', { email });

        if (response.success) {
          // Show credentials form
          currentEmail = email;
          emailContainer.classList.add('hidden');
          credentialsContainer.classList.add('active');

          // Focus on username input
          usernameInput.focus();

          app.showAlert('Email verified. Please enter your credentials.', 'success');
        } else {
          app.showAlert(response.error || 'Email not authorized', 'error');

          // Re-enable form
          emailInput.disabled = false;
          emailForm.querySelector('button').disabled = false;
        }
      } catch (error) {
        console.error('Error checking email:', error);
        app.showAlert('An error occurred. Please try again.', 'error');

        // Re-enable form
        emailInput.disabled = false;
        emailForm.querySelector('button').disabled = false;
      }
    });
  }



  // Handle back to email button
  if (backToEmailButton) {
    backToEmailButton.addEventListener('click', () => {
      // Go back to email form
      credentialsContainer.classList.remove('active');
      emailContainer.classList.remove('hidden');
      emailInput.disabled = false;
      emailForm.querySelector('button').disabled = false;

      // Clear inputs
      usernameInput.value = '';
      passwordInput.value = '';
      currentEmail = '';
    });
  }

  // Handle credentials form submission
  if (credentialsForm) {
    credentialsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      if (!username || !password) {
        app.showAlert('Please enter both username and password', 'error');
        return;
      }

      // Disable form
      usernameInput.disabled = true;
      passwordInput.disabled = true;
      credentialsForm.querySelector('button').disabled = true;

      try {
        // Login with credentials
        const response = await app.apiRequest('auth/login', 'POST', {
          email: currentEmail,
          username,
          password
        });

        if (response.success) {
          app.showAlert('Authentication successful. Redirecting...', 'success');

          // Save API key to localStorage if available
          if (response.data && response.data.apiKey) {
            console.log('Saving API key to localStorage');
            localStorage.setItem('reclast_api_key', response.data.apiKey);
          }

          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          app.showAlert(response.error || 'Invalid username or password', 'error');

          // Re-enable form
          usernameInput.disabled = false;
          passwordInput.disabled = false;
          credentialsForm.querySelector('button').disabled = false;
          passwordInput.value = '';
          passwordInput.focus();
        }
      } catch (error) {
        console.error('Error during login:', error);
        app.showAlert('An error occurred. Please try again.', 'error');

        // Re-enable form
        usernameInput.disabled = false;
        passwordInput.disabled = false;
        credentialsForm.querySelector('button').disabled = false;
      }
    });
  }
}

// Add to window.app for initialization from main.js
if (window.app) {
  window.app.initLoginPage = initLoginPage;
}
