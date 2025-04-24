/**
 * Image generation page JavaScript
 */

// Store current settings for API examples
let currentSettings = {
  model: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  width: 640,
  height: 640,
  steps: 30,
  prompt: ''
};

function initImagePage() {
  // Initialize form elements
  const imageForm = document.getElementById('image-form');
  const modelSelect = document.getElementById('model-select');
  const promptInput = document.getElementById('prompt-input');
  const stepsRange = document.getElementById('steps-range');
  const stepsValue = document.getElementById('steps-value');
  const dimensionRadios = document.querySelectorAll('input[name="dimensions"]');
  const generateButton = document.getElementById('generate-button');
  const downloadButton = document.getElementById('download-button');
  const imagePreview = document.getElementById('image-preview');
  const imageLoading = document.getElementById('image-loading');
  const promptDisplay = document.getElementById('prompt-display');

  // Initialize API tabs
  app.initTabs('api-tabs');

  // Initialize copy buttons
  initCopyButtons();

  // Fetch available models
  fetchModels();

  // Update steps value display when range input changes
  if (stepsRange && stepsValue) {
    stepsRange.addEventListener('input', () => {
      stepsValue.textContent = stepsRange.value;
      currentSettings.steps = parseInt(stepsRange.value);
      updateApiExamples();
    });
  }

  // Update dimensions when radio buttons change
  if (dimensionRadios.length > 0) {
    dimensionRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          const dimensions = radio.value.split('x');
          currentSettings.width = parseInt(dimensions[0]);
          currentSettings.height = parseInt(dimensions[1]);
          updateApiExamples();
        }
      });
    });
  }

  // Update model when select changes
  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      currentSettings.model = modelSelect.value;
      updateApiExamples();
    });
  }

  // Update prompt when input changes
  if (promptInput) {
    promptInput.addEventListener('input', () => {
      currentSettings.prompt = promptInput.value;
      updateApiExamples();
    });
  }

  // Handle form submission
  if (imageForm) {
    imageForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const prompt = promptInput.value.trim();

      if (!prompt) {
        app.showAlert('Please enter a prompt', 'error');
        return;
      }

      // Show loading state
      generateButton.disabled = true;
      imageLoading.classList.add('active');

      try {
        // Get form values
        const model = modelSelect.value;
        const steps = parseInt(stepsRange.value);

        // Get selected dimensions
        let width = 640;
        let height = 640;

        for (const radio of dimensionRadios) {
          if (radio.checked) {
            const dimensions = radio.value.split('x');
            width = parseInt(dimensions[0]);
            height = parseInt(dimensions[1]);
            break;
          }
        }

        // Adjust steps based on model
        let adjustedSteps = steps;
        if (model.includes('flux') && steps > 8) {
          console.log(`Adjusting steps from ${steps} to 8 for Flux model`);
          adjustedSteps = 8;
          // Update the steps slider to reflect the change
          const stepsSlider = document.getElementById('steps-slider');
          const stepsValue = document.getElementById('steps-value');
          if (stepsSlider) stepsSlider.value = adjustedSteps;
          if (stepsValue) stepsValue.textContent = adjustedSteps;
        } else if (model.includes('dreamshaper') && steps > 10) {
          console.log(`Adjusting steps from ${steps} to 10 for DreamShaper model`);
          adjustedSteps = 10;
          // Update the steps slider to reflect the change
          const stepsSlider = document.getElementById('steps-slider');
          const stepsValue = document.getElementById('steps-value');
          if (stepsSlider) stepsSlider.value = adjustedSteps;
          if (stepsValue) stepsValue.textContent = adjustedSteps;
        } else if (model.includes('lightning') && steps > 4) {
          console.log(`Adjusting steps from ${steps} to 4 for SDXL Lightning model`);
          adjustedSteps = 4;
          // Update the steps slider to reflect the change
          const stepsSlider = document.getElementById('steps-slider');
          const stepsValue = document.getElementById('steps-value');
          if (stepsSlider) stepsSlider.value = adjustedSteps;
          if (stepsValue) stepsValue.textContent = adjustedSteps;
        }

        // Update current settings
        currentSettings = {
          model,
          width,
          height,
          steps: adjustedSteps,
          prompt
        };

        // Generate image
        const response = await generateImage(prompt, model, width, height, adjustedSteps);

        // Check if we got a valid response
        if (!response) {
          throw new Error('No response received from the server');
        }

        // Display the image
        displayImage(response);

        // Show the prompt
        promptDisplay.textContent = prompt;

        // Update API examples
        updateApiExamples();

        // Enable download button
        downloadButton.disabled = false;

        // Log success
        console.log('Image generated successfully');
      } catch (error) {
        console.error('Error generating image:', error);
        app.showAlert('Failed to generate image. Please try again.', 'error');
      } finally {
        // Hide loading state
        generateButton.disabled = false;
        imageLoading.classList.remove('active');
      }
    });
  }

  // Handle download button
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      const img = imagePreview.querySelector('img');
      if (img && img.src) {
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = img.src;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }
}

/**
 * Fetch available image models
 */
async function fetchModels() {
  try {
    const response = await app.apiRequest('image/models', 'GET');

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
    updateApiExamples();
  }
}

/**
 * Generate an image
 */
async function generateImage(prompt, model, width, height, steps) {
  try {
    // Check if this is a premium model (Flux)
    const confirmPremium = model.includes('flux');

    // Make the request
    const response = await fetch('/api/image/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        model,
        width,
        height,
        steps,
        confirmPremium: confirmPremium // Add confirmPremium flag for premium models
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin' // Important for authentication
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate image');
    }

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned ${response.status}: ${response.statusText}`);
    }

    // Get the image blob
    const blob = await response.blob();

    // Check if the blob is valid
    if (!blob || blob.size === 0) {
      throw new Error('Received empty image data');
    }

    console.log(`Received image blob, size: ${blob.size} bytes, type: ${blob.type}`);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Display the generated image
 */
function displayImage(imageUrl) {
  const imagePreview = document.getElementById('image-preview');
  const placeholder = document.getElementById('image-preview-placeholder');

  if (!imagePreview) return;

  // Clear existing content
  imagePreview.innerHTML = '';

  // Create image element
  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = 'Generated image';

  // Add to preview
  imagePreview.appendChild(img);

  // Hide placeholder if it exists
  if (placeholder) {
    placeholder.style.display = 'none';
  }
}

/**
 * Initialize copy buttons for API examples
 */
function initCopyButtons() {
  // Wait for DOM to be fully loaded
  setTimeout(() => {
    const copyButtons = document.querySelectorAll('.copy-button');
    console.log(`Found ${copyButtons.length} copy buttons`);

    copyButtons.forEach((button, index) => {
      button.addEventListener('click', async () => {
        try {
          console.log(`Copy button ${index} clicked`);

          // Get the tab content instead of code block
          const tabContent = button.closest('.tab-content');
          if (!tabContent) {
            console.error('Could not find tab content parent element');
            return;
          }

          // Find the code element within this tab content
          const code = tabContent.querySelector('code');
          if (!code) {
            console.error('Could not find code element in tab content');
            return;
          }

          console.log('Found code element, content length:', code.textContent.length);
          const codeText = code.textContent || '';

          // Use the browser's clipboard API directly
          try {
            await navigator.clipboard.writeText(codeText);
            console.log('Text copied to clipboard');

            const originalText = button.textContent;
            button.textContent = 'Copied!';

            setTimeout(() => {
              button.textContent = originalText;
            }, 2000);
          } catch (clipboardError) {
            console.error('Clipboard API error:', clipboardError);
            app.showAlert('Failed to copy to clipboard. Your browser may not support this feature.', 'error');
          }
        } catch (error) {
          console.error('Error copying code:', error);
          app.showAlert('Failed to copy code', 'error');
        }
      });
    });
  }, 500); // Give the DOM time to fully render
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

  // Check if this is a premium model (Flux)
  const isFluxModel = currentSettings.model && currentSettings.model.includes('flux');

  // Adjust steps based on model
  let adjustedSteps = currentSettings.steps;
  if (isFluxModel && adjustedSteps > 8) {
    adjustedSteps = 8;
  } else if (currentSettings.model && currentSettings.model.includes('dreamshaper') && adjustedSteps > 10) {
    adjustedSteps = 10;
  } else if (currentSettings.model && currentSettings.model.includes('lightning') && adjustedSteps > 4) {
    adjustedSteps = 4;
  }

  // Get the API key from localStorage if available
  const apiKey = localStorage.getItem('reclast_api_key') || 'YOUR_API_KEY';

  const curlExample = `curl -X POST https://aireclast.umiteski.workers.dev/api/image/generate \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apiKey}" \\
-d '{
  "prompt": "${escapeJson(currentSettings.prompt || 'A cyberpunk cat in a neon city')}",
  "model": "${currentSettings.model}",
  "width": ${currentSettings.width},
  "height": ${currentSettings.height},
  "steps": ${adjustedSteps}${isFluxModel ? ',\n  "confirmPremium": true' : ''}
}'`;

  curlCode.textContent = curlExample;
}

/**
 * Update the Python example
 */
function updatePythonExample() {
  const pythonCode = document.getElementById('python-code');

  if (!pythonCode) return;

  // Check if this is a premium model (Flux)
  const isFluxModel = currentSettings.model && currentSettings.model.includes('flux');

  // Adjust steps based on model
  let adjustedSteps = currentSettings.steps;
  if (isFluxModel && adjustedSteps > 8) {
    adjustedSteps = 8;
  } else if (currentSettings.model && currentSettings.model.includes('dreamshaper') && adjustedSteps > 10) {
    adjustedSteps = 10;
  } else if (currentSettings.model && currentSettings.model.includes('lightning') && adjustedSteps > 4) {
    adjustedSteps = 4;
  }

  // Get the API key from localStorage if available
  const apiKey = localStorage.getItem('reclast_api_key') || 'YOUR_API_KEY';

  const pythonExample = `import requests
import json

url = "https://aireclast.umiteski.workers.dev/api/image/generate"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey}"
}
data = {
    "prompt": "${escapeJson(currentSettings.prompt || 'A cyberpunk cat in a neon city')}",
    "model": "${currentSettings.model}",
    "width": ${currentSettings.width},
    "height": ${currentSettings.height},
    "steps": ${adjustedSteps}${isFluxModel ? ',\n    "confirmPremium": True' : ''}
}

response = requests.post(url, headers=headers, data=json.dumps(data))

# Save the image
if response.status_code == 200:
    with open("generated_image.png", "wb") as f:
        f.write(response.content)
    print("Image saved as generated_image.png")
else:
    print(f"Error: {response.status_code}")
    print(response.text)`;

  pythonCode.textContent = pythonExample;
}

/**
 * Update the JavaScript example
 */
function updateJsExample() {
  const jsCode = document.getElementById('js-code');

  if (!jsCode) return;

  // Check if this is a premium model (Flux)
  const isFluxModel = currentSettings.model && currentSettings.model.includes('flux');

  // Adjust steps based on model
  let adjustedSteps = currentSettings.steps;
  if (isFluxModel && adjustedSteps > 8) {
    adjustedSteps = 8;
  } else if (currentSettings.model && currentSettings.model.includes('dreamshaper') && adjustedSteps > 10) {
    adjustedSteps = 10;
  } else if (currentSettings.model && currentSettings.model.includes('lightning') && adjustedSteps > 4) {
    adjustedSteps = 4;
  }

  // Get the API key from localStorage if available
  const apiKey = localStorage.getItem('reclast_api_key') || 'YOUR_API_KEY';

  const jsExample = `async function generateImage() {
  const url = 'https://aireclast.umiteski.workers.dev/api/image/generate';
  const data = {
    prompt: "${escapeJson(currentSettings.prompt || 'A cyberpunk cat in a neon city')}",
    model: "${currentSettings.model}",
    width: ${currentSettings.width},
    height: ${currentSettings.height},
    steps: ${adjustedSteps}${isFluxModel ? ',\n    confirmPremium: true' : ''}
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${apiKey}'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    // Get the image as a blob
    const imageBlob = await response.blob();

    // Create an object URL for the blob
    const imageUrl = URL.createObjectURL(imageBlob);

    // Display the image
    const img = document.createElement('img');
    img.src = imageUrl;
    document.body.appendChild(img);
  } catch (error) {
    console.error('Error generating image:', error);
  }
}

generateImage();`;

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
  window.app.initImagePage = initImagePage;
}
