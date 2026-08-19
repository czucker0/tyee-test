import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export type WebLLMState = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported';

interface EngineStatus {
  state: WebLLMState;
  progress: number;
  progressText: string;
  modelName: string;
}

// Recommended fast & lightweight instruction models for WebGPU
const DEFAULT_MODEL = 'SmolLM2-360M-Instruct-q4f16_1-MLC';

let engineInstance: MLCEngine | null = null;
let initPromise: Promise<MLCEngine | null> | null = null;

const currentStatus: EngineStatus = {
  state: 'idle',
  progress: 0,
  progressText: '',
  modelName: DEFAULT_MODEL,
};

const listeners = new Set<(status: EngineStatus) => void>();

function notifyListeners() {
  const statusCopy = { ...currentStatus };
  listeners.forEach((fn) => {
    try {
      fn(statusCopy);
    } catch {
      // Ignore listener error
    }
  });
}

export function subscribeWebLLMStatus(callback: (status: EngineStatus) => void): () => void {
  listeners.add(callback);
  callback({ ...currentStatus });
  return () => {
    listeners.delete(callback);
  };
}

export function getWebLLMStatus(): EngineStatus {
  return { ...currentStatus };
}

/**
 * Checks if the browser supports WebGPU
 */
export function isWebGPUSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator && !!navigator.gpu;
}

/**
 * Initialize WebLLM in the background
 */
export async function initWebLLMBackground(): Promise<MLCEngine | null> {
  if (engineInstance) {
    return engineInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  if (!isWebGPUSupported()) {
    currentStatus.state = 'unsupported';
    currentStatus.progressText = 'WebGPU not available on this device';
    notifyListeners();
    return null;
  }

  currentStatus.state = 'loading';
  currentStatus.progress = 0.05;
  currentStatus.progressText = 'Initializing in-browser WebGPU engine...';
  notifyListeners();

  initPromise = (async () => {
    try {
      currentStatus.modelName = DEFAULT_MODEL;
      currentStatus.progressText = 'Downloading neural model into browser cache...';
      notifyListeners();

      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      const engine = await CreateMLCEngine(DEFAULT_MODEL, {
        initProgressCallback: (report: InitProgressReport) => {
          currentStatus.progress = report.progress;
          currentStatus.progressText = report.text;
          notifyListeners();
        },
      });

      engineInstance = engine;
      currentStatus.state = 'ready';
      currentStatus.progress = 1.0;
      currentStatus.progressText = 'Steelie Dan AI Neural Engine Ready (Local WebGPU)';
      notifyListeners();

      console.log('[WebLLM] Engine ready on WebGPU');
      return engine;
    } catch (err: any) {
      console.error('[WebLLM] Init failed:', err);
      currentStatus.state = 'error';
      currentStatus.progressText = err?.message || 'Failed to initialize WebGPU engine';
      notifyListeners();
      return null;
    }
  })();

  return initPromise;
}

/**
 * Generate chat completion using WebLLM with real-time streaming
 */
export async function generateWebLLMChat(
  systemInstruction: string,
  userPrompt: string,
  history?: Array<{ role: 'user' | 'assistant'; text: string }>,
  onTokenChunk?: (delta: string, fullText: string) => void
): Promise<string | null> {
  // If engine is not yet ready, return null to use instant local knowledge
  if (!engineInstance || currentStatus.state !== 'ready') {
    console.log('[WebLLM] Engine not ready yet, skipping WebGPU');
    return null;
  }

  try {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemInstruction,
      },
    ];

    if (Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-4);
      for (const h of recent) {
        messages.push({
          role: h.role,
          content: h.text,
        });
      }
    }

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    console.log('[WebLLM] Streaming tokens from local WebGPU for:', userPrompt);
    const startTime = Date.now();

    const stream = await engineInstance.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 350,
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        if (onTokenChunk) {
          onTokenChunk(delta, fullText);
        }
      }
    }

    if (fullText.trim().length > 0) {
      console.log(`[WebLLM] Completed ${fullText.length} chars in ${Date.now() - startTime}ms on WebGPU`);
      return fullText.trim();
    }
  } catch (err) {
    console.error('[WebLLM] WebGPU inference error:', err);
  }

  return null;
}
