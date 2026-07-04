/**
 * Groq Whisper voice-to-text transcription.
 * Uses the Groq API to transcribe audio (OGG/MP3/etc) to text.
 */
const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

/**
 * Transcribe an audio file buffer to text via Groq's Whisper API.
 *
 * @param fileBuffer — the raw audio file bytes
 * @param fileName — original filename (used for MIME type detection by Groq)
 * @returns transcribed text, or null on failure
 */
export async function transcribeVoice(fileBuffer: Buffer, fileName: string): Promise<string | null> {
 const apiKey = process.env.GROQ_API_KEY;
 if (!apiKey) {
  console.error("GROQ_API_KEY is not set");
  return null;
 }

 try {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(fileBuffer)], { type: "audio/ogg" }), fileName);
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("response_format", "json");

  const res = await fetch(GROQ_TRANSCRIBE_URL, {
   method: "POST",
   headers: {
    Authorization: `Bearer ${apiKey}`,
   },
   body: formData,
  });

  if (!res.ok) {
   const err = await res.text().catch(() => "unknown");
   console.error("Groq Whisper transcription failed:", res.status, err);
   return null;
  }

  const data = (await res.json()) as { text?: string };
  return data.text ?? null;
 } catch (err) {
  console.error("Groq Whisper transcription error:", err);
  return null;
 }
}
