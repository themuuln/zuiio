import { google } from "@ai-sdk/google";
import { generateText } from "ai";

type QuestionContext = {
  stage?: string;
  daysTogether?: number;
  recentTopics?: string[];
  moodA?: string;
  moodB?: string;
  partnerAName?: string;
  partnerBName?: string;
};

export async function generateDailyQuestion(context: QuestionContext): Promise<string> {
  const prompt = `You are generating a personalized daily question for a couple using the Gerbul app.

Context:
- Relationship stage: ${context.stage || "dating"}
- Days together: ${context.daysTogether || "unknown"}
${context.partnerAName ? `- Partner A: ${context.partnerAName}` : ""}
${context.partnerBName ? `- Partner B: ${context.partnerBName}` : ""}
${context.recentTopics?.length ? `- Topics recently discussed: ${context.recentTopics.join(", ")}` : ""}
${context.moodA ? `- Partner A's mood: ${context.moodA}` : ""}
${context.moodB ? `- Partner B's mood: ${context.moodB}` : ""}

Generate a unique, thoughtful question in MONGOLIAN that:
1. Is appropriate for their relationship stage
2. Feels personal and specific, not generic
3. Can lead to real conversation (not yes/no)
4. References Mongolian daily life where natural (цай, айраг, Наадам, гэр бүл)
5. Is warm in tone, not clinical
6. Avoids topics they've covered recently if known

Output just the question text in Mongolian Cyrillic, nothing else.`;

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt,
    temperature: 0.8,
    maxTokens: 150,
  });

  return text.trim();
}

export async function generateFollowUpQuestion(
  originalQuestion: string,
  partnerAResponse: string,
  partnerBResponse: string,
): Promise<string> {
  const prompt = `Based on this couple's conversation:

Original question: "${originalQuestion}"
Partner A's answer: "${partnerAResponse}"
Partner B's answer: "${partnerBResponse}"

Generate a thoughtful follow-up question in MONGOLIAN that deepens the conversation.
The question should build on what was shared and encourage further reflection.
Output just the question text in Mongolian Cyrillic, nothing else.`;

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt,
    temperature: 0.7,
    maxTokens: 150,
  });

  return text.trim();
}
