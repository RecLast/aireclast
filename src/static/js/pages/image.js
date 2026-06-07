/**
 * Image generation page JavaScript
 */

let imageModelsCatalog = [];
let isImageGenerating = false;
let currentSettings = {
  model: '',
  width: 1024,
  height: 1024,
  steps: 4,
  prompt: '',
  confirmPremium: false,
};

function setGenerateBusy(isBusy, generateButton, imageLoading, imageForm) {
  isImageGenerating = isBusy;

  if (generateButton) {
    generateButton.disabled = isBusy;
    generateButton.classList.toggle('is-generating', isBusy);
    generateButton.setAttribute('aria-busy', isBusy ? 'true' : 'false');

    if (isBusy) {
      if (!generateButton.dataset.originalHtml) {
        generateButton.dataset.originalHtml = generateButton.innerHTML;
      }
      generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    } else if (generateButton.dataset.originalHtml) {
      generateButton.innerHTML = generateButton.dataset.originalHtml;
    }
  }

  if (imageLoading) {
    imageLoading.classList.toggle('active', isBusy);
  }

  if (imageForm) {
    imageForm.querySelectorAll('input, textarea, select').forEach((el) => {
      el.disabled = isBusy;
    });
  }
}

function initImagePage() {
  const imageForm = document.getElementById('image-form');
  const modelSelect = document.getElementById('model-select');
  const promptInput = document.getElementById('prompt-input');
  const stepsRange = document.getElementById('steps-range');
  const stepsValue = document.getElementById('steps-value');
  const generateButton = document.getElementById('generate-button');
  const downloadButton = document.getElementById('download-button');
  const imagePreview = document.getElementById('image-preview');
  const imageLoading = document.getElementById('image-loading');
  const promptDisplay = document.getElementById('prompt-display');

  app.initTabs('api-tabs');
  initCopyButtons();
  fetchModels();

  if (stepsRange && stepsValue) {
    stepsRange.addEventListener('input', () => {
      stepsValue.textContent = stepsRange.value;
      currentSettings.steps = parseInt(stepsRange.value, 10);
      updateApiExamples();
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      applyModelConfig(modelSelect.value);
      updateApiExamples();
    });
  }

  if (promptInput) {
    promptInput.addEventListener('input', () => {
      currentSettings.prompt = promptInput.value;
      updateApiExamples();
    });
  }

  if (imageForm) {
    imageForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (isImageGenerating) {
        return;
      }

      const prompt = promptInput.value.trim();

      if (!prompt) {
        app.showAlert('Please enter a prompt', 'error');
        return;
      }

      const modelConfig = getSelectedModelConfig();
      if (!modelConfig) {
        app.showAlert('Please select a model', 'error');
        return;
      }

      if (modelConfig.requiresPremiumConfirm) {
        const confirmed = confirm(
          `${modelConfig.name} uses more Neurons per image than SDXL Lightning. Continue?`
        );
        if (!confirmed) {
          return;
        }
      }

      setGenerateBusy(true, generateButton, imageLoading, imageForm);

      try {
        const { width, height, steps } = getSelectedDimensionsAndSteps(modelConfig);

        currentSettings = {
          model: modelConfig.id,
          width,
          height,
          steps,
          prompt,
          confirmPremium: modelConfig.requiresPremiumConfirm ?? false,
        };

        const response = await generateImage(
          prompt,
          modelConfig.id,
          width,
          height,
          steps,
          currentSettings.confirmPremium
        );

        displayImage(response);
        promptDisplay.textContent = prompt;
        updateApiExamples();
        downloadButton.disabled = false;
      } catch (error) {
        console.error('Error generating image:', error);
        app.showAlert(error.message || 'Failed to generate image. Please try again.', 'error');
      } finally {
        setGenerateBusy(false, generateButton, imageLoading, imageForm);
      }
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      const img = imagePreview.querySelector('img');
      if (img?.src) {
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

async function fetchModels() {
  try {
    const response = await app.apiRequest('image/models', 'GET');

    if (response.success && response.data?.models) {
      imageModelsCatalog = response.data.models;
      populateModelSelect(imageModelsCatalog, response.data.defaultModel);
    }
  } catch (error) {
    console.error('Error fetching models:', error);
    app.showAlert('Failed to load available models', 'error');
  }
}

function populateModelSelect(models, defaultModelId) {
  const modelSelect = document.getElementById('model-select');
  if (!modelSelect) return;

  modelSelect.innerHTML = '';

  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = `${model.name} (${model.neuronCost} Neuron cost)`;
    option.title = model.description;
    modelSelect.appendChild(option);
  });

  const initialModel = defaultModelId || models[0]?.id;
  if (initialModel) {
    modelSelect.value = initialModel;
    applyModelConfig(initialModel);
  }
}

function getSelectedModelConfig() {
  const modelSelect = document.getElementById('model-select');
  if (!modelSelect?.value) return null;
  return imageModelsCatalog.find((m) => m.id === modelSelect.value) ?? null;
}

function applyModelConfig(modelId) {
  const model = imageModelsCatalog.find((m) => m.id === modelId);
  if (!model) return;

  currentSettings.model = model.id;
  currentSettings.confirmPremium = model.requiresPremiumConfirm ?? false;

  const stepsRange = document.getElementById('steps-range');
  const stepsValue = document.getElementById('steps-value');
  const neuronNote = document.getElementById('model-neuron-note');

  if (stepsRange && stepsValue) {
    stepsRange.min = '1';
    stepsRange.max = String(model.maxSteps);
    stepsRange.value = String(model.defaultSteps);
    stepsValue.textContent = String(model.defaultSteps);
    currentSettings.steps = model.defaultSteps;
  }

  if (neuronNote) {
    neuronNote.textContent = model.neuronNote;
  }

  renderDimensions(model.dimensions);
}

function renderDimensions(dimensions) {
  const container = document.getElementById('dimension-options');
  if (!container || !dimensions?.length) return;

  container.innerHTML = '';

  dimensions.forEach((dimension, index) => {
    const value = `${dimension.width}x${dimension.height}`;
    const id = `dim-${dimension.width}x${dimension.height}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'dimension-option';
    wrapper.innerHTML = `
      <input type="radio" id="${id}" name="dimensions" value="${value}" class="dimension-radio" ${index === 0 ? 'checked' : ''}>
      <label for="${id}" class="dimension-label">
        <div class="dimension-preview ${dimension.aspect}"></div>
        <div class="dimension-text">${dimension.label}</div>
      </label>
    `;

    container.appendChild(wrapper);
  });

  const first = dimensions[0];
  currentSettings.width = first.width;
  currentSettings.height = first.height;

  container.querySelectorAll('input[name="dimensions"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        const [width, height] = radio.value.split('x').map(Number);
        currentSettings.width = width;
        currentSettings.height = height;
        updateApiExamples();
      }
    });
  });
}

function getSelectedDimensionsAndSteps(modelConfig) {
  const stepsRange = document.getElementById('steps-range');
  const steps = parseInt(stepsRange?.value || String(modelConfig.defaultSteps), 10);

  let width = modelConfig.dimensions[0].width;
  let height = modelConfig.dimensions[0].height;

  const selected = document.querySelector('input[name="dimensions"]:checked');
  if (selected) {
    const parts = selected.value.split('x');
    width = parseInt(parts[0], 10);
    height = parseInt(parts[1], 10);
  }

  return { width, height, steps };
}

async function generateImage(prompt, model, width, height, steps, confirmPremium = false) {
  const body = { prompt, model, width, height, steps };
  if (confirmPremium) {
    body.confirmPremium = true;
  }

  let response = await postImageGenerate(body);

  if (response.status === 202) {
    const queueData = await response.json();
    if (!queueData.success || !queueData.data?.queueToken) {
      throw new Error(queueData.error || 'Failed to enter image queue');
    }

    await waitForImageQueue(queueData.data);
    response = await postImageGenerate({ ...body, queueToken: queueData.data.queueToken });
  }

  if (response.status === 425) {
    let errorMessage = 'Queue is still active. Please wait.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let errorMessage = 'Failed to generate image';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `Server returned ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  if (!blob?.size) {
    throw new Error('Received empty image data');
  }

  return URL.createObjectURL(blob);
}

async function postImageGenerate(body) {
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = localStorage.getItem('reclast_api_key');
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return fetch('/api/image/generate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
    credentials: 'same-origin',
  });
}

function showQueueModal(position, waitSeconds) {
  const modal = document.getElementById('queue-modal');
  const positionEl = document.getElementById('queue-position');
  const countdownEl = document.getElementById('queue-countdown');
  const progressBar = document.getElementById('queue-progress-bar');

  if (!modal || !positionEl || !countdownEl || !progressBar) {
    return;
  }

  positionEl.textContent = String(position);
  countdownEl.textContent = `${waitSeconds}s`;
  progressBar.style.width = '0%';
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function updateQueueModal(position, remainingSeconds, totalSeconds) {
  const positionEl = document.getElementById('queue-position');
  const countdownEl = document.getElementById('queue-countdown');
  const progressBar = document.getElementById('queue-progress-bar');

  if (positionEl) {
    positionEl.textContent = String(position);
  }

  if (countdownEl) {
    countdownEl.textContent = `${Math.max(0, remainingSeconds)}s`;
  }

  if (progressBar && totalSeconds > 0) {
    const elapsed = totalSeconds - remainingSeconds;
    progressBar.style.width = `${Math.min(100, (elapsed / totalSeconds) * 100)}%`;
  }
}

function hideQueueModal() {
  const modal = document.getElementById('queue-modal');
  if (!modal) return;

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

async function waitForImageQueue(queueData) {
  const { queueToken, position, waitSeconds } = queueData;
  showQueueModal(position, waitSeconds);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearInterval(intervalId);
      hideQueueModal();
      fn();
    };

    const poll = async () => {
      try {
        const response = await app.apiRequest(`image/queue/${queueToken}`, 'GET');
        if (!response.success) {
          finish(() => reject(new Error(response.error || 'Failed to check queue status')));
          return;
        }

        const { status, position: currentPosition, remainingSeconds } = response.data;
        updateQueueModal(currentPosition || position, remainingSeconds ?? 0, waitSeconds);

        if (status === 'ready') {
          finish(resolve);
        }
      } catch (error) {
        finish(() => reject(error));
      }
    };

    poll();
    const intervalId = setInterval(poll, 1000);
  });
}

function displayImage(imageUrl) {
  const imagePreview = document.getElementById('image-preview');
  const placeholder = document.getElementById('image-preview-placeholder');

  if (!imagePreview) return;

  imagePreview.innerHTML = '';
  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = 'Generated image';
  imagePreview.appendChild(img);

  if (placeholder) {
    placeholder.style.display = 'none';
  }
}

function initCopyButtons() {
  setTimeout(() => {
    document.querySelectorAll('.copy-button').forEach((button) => {
      button.addEventListener('click', async () => {
        const code = button.closest('.tab-content')?.querySelector('code');
        if (!code) return;

        try {
          await navigator.clipboard.writeText(code.textContent || '');
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          setTimeout(() => { button.textContent = originalText; }, 2000);
        } catch {
          app.showAlert('Failed to copy to clipboard', 'error');
        }
      });
    });
  }, 500);
}

function updateApiExamples() {
  updateCurlExample();
  updatePythonExample();
  updateJsExample();
}

function buildExamplePayload() {
  const payload = {
    prompt: currentSettings.prompt || 'A cyberpunk cat in a neon city',
    model: currentSettings.model,
    width: currentSettings.width,
    height: currentSettings.height,
    steps: currentSettings.steps,
  };

  if (currentSettings.confirmPremium) {
    payload.confirmPremium = true;
  }

  return payload;
}

function updateCurlExample() {
  const curlCode = document.getElementById('curl-code');
  if (!curlCode) return;

  const baseUrl = window.location.origin;
  const apiKey = localStorage.getItem('reclast_api_key') || 'YOUR_API_KEY';
  const payload = buildExamplePayload();

  curlCode.textContent = `curl -X POST ${baseUrl}/api/image/generate \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apiKey}" \\
-d '${JSON.stringify(payload, null, 2)}'`;
}

function updatePythonExample() {
  const pythonCode = document.getElementById('python-code');
  if (!pythonCode) return;

  const baseUrl = window.location.origin;
  const apiKey = localStorage.getItem('reclast_api_key') || 'YOUR_API_KEY';
  const payload = buildExamplePayload();

  pythonCode.textContent = `import requests
import json

url = "${baseUrl}/api/image/generate"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${apiKey}"
}
data = ${JSON.stringify(payload, null, 4)}

response = requests.post(url, headers=headers, data=json.dumps(data))

if response.status_code == 200:
    with open("generated_image.png", "wb") as f:
        f.write(response.content)
else:
    print(response.status_code, response.text)`;
}

function updateJsExample() {
  const jsCode = document.getElementById('js-code');
  if (!jsCode) return;

  const baseUrl = window.location.origin;
  const apiKey = localStorage.getItem('reclast_api_key') || 'YOUR_API_KEY';
  const payload = buildExamplePayload();

  jsCode.textContent = `const response = await fetch('${baseUrl}/api/image/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${apiKey}'
  },
  body: JSON.stringify(${JSON.stringify(payload, null, 4)})
});`;
}

if (window.app) {
  window.app.initImagePage = initImagePage;
}
