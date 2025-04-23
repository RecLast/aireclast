/**
 * Code generation page JavaScript
 */

// Store current settings for API examples
let currentSettings = {
  model: '@cf/meta/llama-2-7b-chat-int8',
  prompt: ''
};

// Store chat history
let chatHistory = [];

function initCodePage() {
  // Initialize form elements
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const modelSelect = document.getElementById('model-select');
  const typingIndicator = document.getElementById('typing-indicator');

  // Initialize API tabs
  app.initTabs('api-tabs');

  // Initialize copy buttons
  initCopyButtons();

  // Fetch available models
  fetchModels();

  // Update model when select changes
  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      currentSettings.model = modelSelect.value;
      updateApiExamples();

      // Update chat header with selected model
      const chatModelName = document.getElementById('chat-model-name');
      if (chatModelName) {
        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        chatModelName.textContent = selectedOption.textContent;
      }
    });
  }

  // Handle form submission
  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const prompt = chatInput.value.trim();

      if (!prompt) {
        return;
      }

      // Add user message to chat
      addMessage('user', prompt);

      // Clear input
      chatInput.value = '';

      // Update current settings
      currentSettings.prompt = prompt;

      // Show typing indicator
      if (typingIndicator) {
        typingIndicator.style.display = 'flex';
      }

      try {
        // Get selected model
        const model = modelSelect.value;

        // Generate code
        const response = await generateCode(prompt, model);

        // Add AI message to chat
        if (response.success && response.data && response.data.result) {
          const result = response.data.result;
          const text = result.response || result;

          // Format code blocks in the response
          const formattedText = formatCodeInText(text);

          addMessage('ai', formattedText, true);

          // Update API examples
          updateApiExamples();
        } else {
          throw new Error(response.error || 'Failed to generate code');
        }
      } catch (error) {
        console.error('Error generating code:', error);
        app.showAlert('Failed to generate code. Please try again.', 'error');
      } finally {
        // Hide typing indicator
        if (typingIndicator) {
          typingIndicator.style.display = 'none';
        }
      }
    });
  }

  // Auto-resize chat input
  if (chatInput) {
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });
  }
}

/**
 * Fetch available code models
 */
async function fetchModels() {
  try {
    const response = await app.apiRequest('code/models', 'GET');

    if (response.success && response.data && response.data.models) {
      populateModelSelect(response.data.models);
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    app.showAlert('Failed to load available models', 'error');
  }
}

/**
 * Populate the model select dropdown
 */
function populateModelSelect(models) {
  const modelSelect = document.getElementById('model-select');

  if (!modelSelect) return;

  // Clear existing options
  modelSelect.innerHTML = '';

  // Add models to select
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    option.title = model.description;
    modelSelect.appendChild(option);
  });

  // Update current settings
  if (models.length > 0) {
    currentSettings.model = models[0].id;

    // Update chat header with selected model
    const chatModelName = document.getElementById('chat-model-name');
    if (chatModelName) {
      chatModelName.textContent = models[0].name;
    }

    updateApiExamples();
  }
}

/**
 * Generate code
 */
async function generateCode(prompt, model) {
  try {
    return await app.apiRequest('code/generate', 'POST', {
      prompt,
      model
    });
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

/**
 * Format code blocks in text
 * Detects code blocks with ```language and ``` syntax
 */
function formatCodeInText(text) {
  // Replace code blocks with formatted HTML
  return text.replace(/```(\w*)([\s\S]*?)```/g, (match, language, code) => {
    return `<pre><code class="language-${language || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add a message to the chat
 */
function addMessage(type, text, isHtml = false) {
  const chatMessages = document.getElementById('chat-messages');

  if (!chatMessages) return;

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `message ${type}`;

  // Create avatar
  const avatarElement = document.createElement('div');
  avatarElement.className = 'message-avatar';
  avatarElement.textContent = type === 'user' ? 'U' : 'AI';

  // Create message content
  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';

  // Create message text
  const textElement = document.createElement('div');
  textElement.className = 'message-text';

  if (isHtml) {
    textElement.innerHTML = text;

    // Add copy buttons to code blocks
    const codeBlocks = textElement.querySelectorAll('pre');
    codeBlocks.forEach(block => {
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-code-button';
      copyButton.textContent = 'Copy';
      copyButton.addEventListener('click', async () => {
        const code = block.querySelector('code');
        if (code) {
          const success = await app.copyToClipboard(code.textContent);

          if (success) {
            copyButton.textContent = 'Copied!';

            setTimeout(() => {
              copyButton.textContent = 'Copy';
            }, 2000);
          }
        }
      });

      block.style.position = 'relative';
      block.appendChild(copyButton);
    });
  } else {
    textElement.textContent = text;
  }

  // Create message time
  const timeElement = document.createElement('div');
  timeElement.className = 'message-time';
  timeElement.textContent = new Date().toLocaleTimeString();

  // Assemble message
  contentElement.appendChild(textElement);
  contentElement.appendChild(timeElement);
  messageElement.appendChild(avatarElement);
  messageElement.appendChild(contentElement);

  // Add to chat
  chatMessages.appendChild(messageElement);

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Add to history
  chatHistory.push({
    type,
    text,
    time: new Date().toISOString()
  });
}

/**
 * Initialize copy buttons for API examples
 */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-button');

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const codeBlock = button.closest('.code-block');
      const code = codeBlock.querySelector('code');

      if (code) {
        const success = await app.copyToClipboard(code.textContent);

        if (success) {
          const originalText = button.textContent;
          button.textContent = 'Copied!';

          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      }
    });
  });
}

/**
 * Update API examples with current settings
 */
function updateApiExamples() {
  updateCurlExample();
  updatePythonExample();
  updateJsExample();
}

/**
 * Update the cURL example
 */
function updateCurlExample() {
  const curlCode = document.getElementById('curl-code');

  if (!curlCode) return;

  const curlExample = `curl -X POST https://aireclast.umiteski.workers.dev/api/code/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "prompt": "${escapeJson(currentSettings.prompt || 'Write a function to calculate the Fibonacci sequence in JavaScript')}",
    "model": "${currentSettings.model}"
  }'`;

  curlCode.textContent = curlExample;
}

/**
 * Update the Python example
 */
function updatePythonExample() {
  const pythonCode = document.getElementById('python-code');

  if (!pythonCode) return;

  const pythonExample = `import requests
import json

url = "https://aireclast.umiteski.workers.dev/api/code/generate"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "prompt": "${escapeJson(currentSettings.prompt || 'Write a function to calculate the Fibonacci sequence in JavaScript')}",
    "model": "${currentSettings.model}"
}

response = requests.post(url, headers=headers, data=json.dumps(data))
result = response.json()

if response.status_code == 200 and result.get('success'):
    print(result['data']['result']['response'])
else:
    print(f"Error: {result.get('error', 'Unknown error')}")`;

  pythonCode.textContent = pythonExample;
}

/**
 * Update the JavaScript example
 */
function updateJsExample() {
  const jsCode = document.getElementById('js-code');

  if (!jsCode) return;

  const jsExample = `async function generateCode() {
  const url = 'https://aireclast.umiteski.workers.dev/api/code/generate';
  const data = {
    prompt: "${escapeJson(currentSettings.prompt || 'Write a function to calculate the Fibonacci sequence in JavaScript')}",
    model: "${currentSettings.model}"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      console.log(result.data.result.response);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Error generating code:', error);
  }
}

generateCode();`;

  jsCode.textContent = jsExample;
}

/**
 * Escape special characters for JSON
 */
function escapeJson(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// Add to window.app for initialization from main.js
if (window.app) {
  window.app.initCodePage = initCodePage;
}
