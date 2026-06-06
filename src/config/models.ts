/**
 * Workers AI model catalog — Cloudflare-hosted models only (free Neuron pool).
 * Single source of truth for text, code, and image endpoints + UI.
 * Models are ordered strongest → weakest (quality/capability first).
 */

export type NeuronCost = 'low' | 'medium' | 'high';

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  neuronCost: NeuronCost;
  neuronNote: string;
}

export interface ImageDimension {
  width: number;
  height: number;
  label: string;
  aspect: 'square' | 'landscape' | 'portrait' | 'wide';
}

export interface ImageModelOption extends ModelOption {
  maxSteps: number;
  defaultSteps: number;
  dimensions: ImageDimension[];
  requiresPremiumConfirm?: boolean;
}

/** Strongest → weakest (7B+ only — quality over ultra-cheap small models) */
export const TEXT_MODELS: ModelOption[] = [
  {
    id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    name: 'Llama 3.3 (70B)',
    description: 'Flagship model — best reasoning and writing quality',
    neuronCost: 'high',
    neuronNote: 'Highest Neuron usage — reserve for demanding tasks',
  },
  {
    id: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1 (24B)',
    description: 'Strong all-rounder — long context and tool use',
    neuronCost: 'high',
    neuronNote: 'Heavy on free tier — great quality per request',
  },
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill (32B)',
    description: 'Reasoning-focused model for complex questions',
    neuronCost: 'high',
    neuronNote: 'Higher Neuron draw — best for logic and analysis',
  },
  {
    id: '@cf/meta/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout (17B)',
    description: 'Newer mid-size model — solid quality at moderate cost',
    neuronCost: 'medium',
    neuronNote: 'Balanced Neuron use between 8B and 24B+ models',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
    name: 'Llama 3.1 (8B)',
    description: 'Recommended default — strong 8B chat at low Neuron cost',
    neuronCost: 'medium',
    neuronNote: '~4.1K neurons per 1M input tokens — best daily value',
  },
];

/** Strongest → weakest (7B+ only) */
export const CODE_MODELS: ModelOption[] = [
  {
    id: '@cf/qwen/qwen2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder (32B)',
    description: 'Strongest code model — best completion quality',
    neuronCost: 'high',
    neuronNote: '~60K neurons per 1M input tokens — use for hard tasks',
  },
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 Distill (32B)',
    description: 'Reasoning model — algorithms, debugging, architecture',
    neuronCost: 'high',
    neuronNote: 'Higher Neuron cost — best for complex logic',
  },
  {
    id: '@cf/qwen/qwen3-30b-a3b-fp8',
    name: 'Qwen 3 (30B)',
    description: 'Recommended default — strong code output, moderate cost',
    neuronCost: 'medium',
    neuronNote: 'Good Neuron/quality balance for daily coding',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
    name: 'Llama 3.1 (8B)',
    description: 'Fast helper for snippets, refactors, and simple scripts',
    neuronCost: 'medium',
    neuronNote: '~4.1K neurons per 1M input tokens — cheapest 7B+ option',
  },
];

/** Strongest → weakest (quality), then consumption within tier */
export const IMAGE_MODELS: ImageModelOption[] = [
  {
    id: '@cf/black-forest-labs/flux-1-schnell',
    name: 'Flux-1 Schnell',
    description: 'Strongest image quality — 1024px, max 8 steps',
    neuronCost: 'medium',
    neuronNote: 'Uses free Neuron pool — ~5–15 Neurons per image typical',
    maxSteps: 8,
    defaultSteps: 4,
    requiresPremiumConfirm: true,
    dimensions: [
      { width: 1024, height: 1024, label: '1024×1024', aspect: 'square' },
    ],
  },
  {
    id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL',
    description: 'High-quality SDXL — flexible dimensions and steps',
    neuronCost: 'medium',
    neuronNote: 'Up to 30 steps — lower steps save Neurons',
    maxSteps: 30,
    defaultSteps: 20,
    dimensions: [
      { width: 1024, height: 1024, label: '1024×1024', aspect: 'square' },
      { width: 1152, height: 896, label: '1152×896', aspect: 'landscape' },
      { width: 896, height: 1152, label: '896×1152', aspect: 'portrait' },
      { width: 1216, height: 832, label: '1216×832', aspect: 'wide' },
      { width: 832, height: 1216, label: '832×1216', aspect: 'portrait' },
    ],
  },
  {
    id: '@cf/bytedance/stable-diffusion-xl-lightning',
    name: 'SDXL Lightning',
    description: 'Fast SDXL — max 4 steps, best Neuron value at 1024px',
    neuronCost: 'low',
    neuronNote: 'Recommended default for free tier daily use',
    maxSteps: 4,
    defaultSteps: 4,
    dimensions: [
      { width: 1024, height: 1024, label: '1024×1024', aspect: 'square' },
      { width: 1152, height: 896, label: '1152×896', aspect: 'landscape' },
      { width: 896, height: 1152, label: '896×1152', aspect: 'portrait' },
    ],
  },
  {
    id: '@cf/lykon/dreamshaper-8-lcm',
    name: 'DreamShaper',
    description: 'Fast 512px generation — lowest resolution option',
    neuronCost: 'low',
    neuronNote: 'Smallest images, max 10 steps — cheapest option',
    maxSteps: 10,
    defaultSteps: 8,
    dimensions: [
      { width: 512, height: 512, label: '512×512', aspect: 'square' },
      { width: 768, height: 512, label: '768×512', aspect: 'landscape' },
      { width: 512, height: 768, label: '512×768', aspect: 'portrait' },
    ],
  },
];

export const DEFAULT_TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
export const DEFAULT_CODE_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8';
export const DEFAULT_IMAGE_MODEL = '@cf/bytedance/stable-diffusion-xl-lightning';

export function getTextModel(modelId?: string): ModelOption {
  return TEXT_MODELS.find((m) => m.id === modelId) ?? TEXT_MODELS.find((m) => m.id === DEFAULT_TEXT_MODEL)!;
}

export function getCodeModel(modelId?: string): ModelOption {
  return CODE_MODELS.find((m) => m.id === modelId) ?? CODE_MODELS.find((m) => m.id === DEFAULT_CODE_MODEL)!;
}

export function getImageModel(modelId?: string): ImageModelOption {
  return IMAGE_MODELS.find((m) => m.id === modelId) ?? IMAGE_MODELS.find((m) => m.id === DEFAULT_IMAGE_MODEL)!;
}

export function resolveImageDimensions(
  model: ImageModelOption,
  width: number,
  height: number
): { width: number; height: number } {
  const match = model.dimensions.find((d) => d.width === width && d.height === height);
  if (match) {
    return { width: match.width, height: match.height };
  }
  const fallback = model.dimensions[0];
  return { width: fallback.width, height: fallback.height };
}

export function clampSteps(model: ImageModelOption, steps: number): number {
  return Math.min(Math.max(steps, 1), model.maxSteps);
}

