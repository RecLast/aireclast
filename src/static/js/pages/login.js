/**
 * Login page JavaScript
 */

function initLoginPage() {
  const emailForm = document.getElementById('email-form');
  const verificationForm = document.getElementById('verification-form');
  const emailContainer = document.querySelector('.email-container');
  const verificationContainer = document.querySelector('.verification-container');
  const emailInput = document.getElementById('email');
  const resendButton = document.getElementById('resend-code');
  const verificationInputs = document.querySelectorAll('.verification-code input');
  
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
        // Request verification code
        const response = await app.apiRequest('auth/request-code', 'POST', { email });
        
        if (response.success) {
          // Show verification form
          currentEmail = email;
          emailContainer.classList.add('hidden');
          verificationContainer.classList.add('active');
          
          // Focus on first verification input
          if (verificationInputs.length > 0) {
            verificationInputs[0].focus();
          }
          
          app.showAlert('Verification code sent to your email', 'success');
        } else {
          app.showAlert(response.error || 'Failed to send verification code', 'error');
          
          // Re-enable form
          emailInput.disabled = false;
          emailForm.querySelector('button').disabled = false;
        }
      } catch (error) {
        console.error('Error requesting verification code:', error);
        app.showAlert('An error occurred. Please try again.', 'error');
        
        // Re-enable form
        emailInput.disabled = false;
        emailForm.querySelector('button').disabled = false;
      }
    });
  }
  
  // Handle verification code inputs
  if (verificationInputs.length > 0) {
    // Auto-focus next input when a digit is entered
    verificationInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
          // Move to next input
          if (index < verificationInputs.length - 1) {
            verificationInputs[index + 1].focus();
          }
        }
      });
      
      // Handle backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value) {
          // Move to previous input
          if (index > 0) {
            verificationInputs[index - 1].focus();
          }
        }
      });
    });
  }
  
  // Handle verification form submission
  if (verificationForm) {
    verificationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get verification code
      let code = '';
      verificationInputs.forEach(input => {
        code += input.value;
      });
      
      if (code.length !== 6) {
        app.showAlert('Please enter the 6-digit verification code', 'error');
        return;
      }
      
      // Disable form
      verificationInputs.forEach(input => {
        input.disabled = true;
      });
      verificationForm.querySelector('button').disabled = true;
      
      try {
        // Verify code
        const response = await app.apiRequest('auth/verify', 'POST', { 
          email: currentEmail, 
          code 
        });
        
        if (response.success) {
          app.showAlert('Authentication successful. Redirecting...', 'success');
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          app.showAlert(response.error || 'Invalid verification code', 'error');
          
          // Re-enable form
          verificationInputs.forEach(input => {
            input.disabled = false;
            input.value = '';
          });
          verificationForm.querySelector('button').disabled = false;
          verificationInputs[0].focus();
        }
      } catch (error) {
        console.error('Error verifying code:', error);
        app.showAlert('An error occurred. Please try again.', 'error');
        
        // Re-enable form
        verificationInputs.forEach(input => {
          input.disabled = false;
        });
        verificationForm.querySelector('button').disabled = false;
      }
    });
  }
  
  // Handle resend code button
  if (resendButton) {
    resendButton.addEventListener('click', async () => {
      if (!currentEmail) {
        // Go back to email form
        verificationContainer.classList.remove('active');
        emailContainer.classList.remove('hidden');
        emailInput.disabled = false;
        emailForm.querySelector('button').disabled = false;
        return;
      }
      
      resendButton.disabled = true;
      
      try {
        // Request new verification code
        const response = await app.apiRequest('auth/request-code', 'POST', { email: currentEmail });
        
        if (response.success) {
          app.showAlert('New verification code sent to your email', 'success');
          
          // Clear verification inputs
          verificationInputs.forEach(input => {
            input.value = '';
          });
          verificationInputs[0].focus();
        } else {
          app.showAlert(response.error || 'Failed to send verification code', 'error');
        }
      } catch (error) {
        console.error('Error requesting verification code:', error);
        app.showAlert('An error occurred. Please try again.', 'error');
      }
      
      // Re-enable button after delay
      setTimeout(() => {
        resendButton.disabled = false;
      }, 5000);
    });
  }
}

// Add to window.app for initialization from main.js
if (window.app) {
  window.app.initLoginPage = initLoginPage;
}
