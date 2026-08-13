/**
 * OpenAI GPT Image API client — thin wrapper over the Images API.
 *
 * Uses the raw HTTP endpoints (same pattern as @zuiio/ai-agent), so no
 * `openai` SDK dependency is required.
 *
 * Env vars:
 *   OPENAI_API_KEY          — required. API key for api.openai.com.
 *   OPENAI_IMAGE_MODEL      — optional. Overrides the default model for all
 *                             image operations (generation + edit).
 *
 * Defaults:
 *   generation: gpt-image-2   (latest text-to-image model)
 *   edit:       gpt-image-1.5 (latest model that supports image input)
 *
 * Error contract:
 *   - Missing API key → returns { error } with a user-facing message
 *     (so callers can short-circuit without a try/catch).
 *   - Provider/network failures → throws. Callers capture with their own
 *     context and map to a user-facing Mongolian message.
 */

export type OpenAiImageQuality = "low" | "medium" | "high";
export type OpenAiImageFormat = "png" | "jpeg" | "webp";
export type OpenAiImageSize = "1024x1024" | "1536x1024" | "1024x1536";
export type OpenAiBackground = "transparent" | "opaque" | "auto";

const API_BASE = "https://api.openai.com/v1/images";
const CONFIG_ERROR =
  "AI үйлчилгээний тохиргоо дутуу байна. OPENAI_API_KEY тохируулна уу.";

export class OpenAiApiError extends Error {}

/** Returns the configured OpenAI API key or throws if missing. */
export function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(CONFIG_ERROR);
  }
  return apiKey;
}

export interface GenerateImageParams {
  prompt: string;
  size?: OpenAiImageSize;
  quality?: OpenAiImageQuality;
  outputFormat?: OpenAiImageFormat;
  background?: OpenAiBackground;
}

export interface EditImageParams extends GenerateImageParams {
  /** Fully qualified URL or base64 data URL of the source image. */
  imageUrl: string;
  /** Fidelity to the original input image. Default "high". */
  inputFidelity?: "high" | "low";
}

export interface OpenAiImageResult {
  /** Base64 data URL of the generated image (e.g. data:image/webp;base64,...). */
  dataUrl?: string;
  error?: string;
}

/** Calls the Images API and normalizes the response to a data URL. */
async function requestImages(
  path: "/generations" | "/edits",
  body: Record<string, unknown>,
): Promise<OpenAiImageResult> {
  let apiKey: string;
  try {
    apiKey = getOpenAiApiKey();
  } catch (e) {
    return { error: e instanceof Error ? e.message : CONFIG_ERROR };
  }

  const outputFormat = (body.output_format as OpenAiImageFormat) ?? "png";

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new OpenAiApiError(
      `OpenAI Images API ${path} failed (${res.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
    );
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    throw new OpenAiApiError("OpenAI Images API returned no image data");
  }

  return { dataUrl: `data:image/${outputFormat};base64,${b64}` };
}

/**
 * Text-to-image generation (POST /images/generations).
 * Default model: gpt-image-2.
 */
export async function generateImage(
  params: GenerateImageParams,
): Promise<OpenAiImageResult> {
  return requestImages("/generations", {
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
    prompt: params.prompt,
    n: 1,
    size: params.size ?? "1024x1024",
    quality: params.quality ?? "medium",
    output_format: params.outputFormat ?? "webp",
    ...(params.background ? { background: params.background } : {}),
  });
}

/**
 * Image-to-image edit (POST /images/edits). Accepts one source image
 * reference (URL or data URL) plus a text prompt.
 * Default model: gpt-image-1.5.
 */
export async function editImage(
  params: EditImageParams,
): Promise<OpenAiImageResult> {
  return requestImages("/edits", {
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5",
    images: [{ image_url: params.imageUrl }],
    prompt: params.prompt,
    n: 1,
    size: params.size ?? "1024x1024",
    quality: params.quality ?? "high",
    output_format: params.outputFormat ?? "webp",
    input_fidelity: params.inputFidelity ?? "high",
    ...(params.background ? { background: params.background } : {}),
  });
}
