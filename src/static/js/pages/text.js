/**
 * Text generation page JavaScript
 */

// Store current settings for API examples
let currentSettings = {
  model: '@cf/meta/llama-2-7b-chat-int8',
  prompt: ''
};

// Store chat history
let chatHistory = [];

function initTextPage() {
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

        // Generate text
        const response = await generateText(prompt, model);

        // Add AI message to chat
        if (response.success && response.data && response.data.result) {
          const result = response.data.result;
          const text = result.response || result;
          addMessage('ai', text);

          // Update API examples
          updateApiExamples();
        } else {
          throw new Error(response.error || 'Failed to generate text');
        }
      } catch (error) {
        console.error('Error generating text:', error);
        app.showAlert('Failed to generate text. Please try again.', 'error');
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
 * Fetch available text models
 */
async function fetchModels() {
  try {
    const response = await app.apiRequest('text/models', 'GET');

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
 * Generate text
 */
async function generateText(prompt, model) {
  try {
    return await app.apiRequest('text/generate', 'POST', {
      prompt,
      model
    });
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

/**
 * Add a message to the chat
 */
function addMessage(type, text) {
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
  textElement.textContent = text;

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

  const curlExample = `curl -X POST https://aireclast.umiteski.workers.dev/api/text/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "prompt": "${escapeJson(currentSettings.prompt || 'Write a short story about a robot learning to paint')}",
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

url = "https://aireclast.umiteski.workers.dev/api/text/generate"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "prompt": "${escapeJson(currentSettings.prompt || 'Write a short story about a robot learning to paint')}",
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

  const jsExample = `async function generateText() {
  const url = 'https://aireclast.umiteski.workers.dev/api/text/generate';
  const data = {
    prompt: "${escapeJson(currentSettings.prompt || 'Write a short story about a robot learning to paint')}",
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
    console.error('Error generating text:', error);
  }
}

generateText();`;

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
  window.app.initTextPage = initTextPage;
}
