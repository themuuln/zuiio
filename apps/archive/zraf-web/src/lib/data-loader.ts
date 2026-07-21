const DATA_PREFIX = "/data/traffic_institute"
const APP_READY = `${DATA_PREFIX}/app_ready`
const CATEGORIES = `${APP_READY}/categories`
const INDEX_PATH = `${APP_READY}/question_bank_index.json`
const OFFICIAL_TESTS_PATH = `${DATA_PREFIX}/tests_playwright.json`

export interface RawQuestion {
  id: string
  prompt?: string
  choices?: string[]
  correctIndex?: number
  shortExplanation?: string
  longExplanation?: string
  topic?: string
  subtopic?: string
  difficulty?: string
  sourceType?: string
  tags?: string[]
  commonMistakeReason?: string
  imagePath?: string
  premiumOnly?: boolean
  pack?: string
  categoryCode?: string
  ocrPrompt?: string
  ocrChoices?: string[]
  ocrAnswerText?: string
  ocrStructured?: boolean
  ocrNonEmptyLineCount?: number
  visual?: {
    kind?: string
    title?: string
    caption?: string
  }
  imageTitle?: string
}

export interface IndexEntry {
  id: string
  categoryCode: string
  subtopic: string
  difficulty: string
  premiumOnly: boolean
  imagePath?: string
  visual?: { kind?: string; title?: string; caption?: string }
}

let indexCache: IndexEntry[] | null = null
let categoryCache = new Map<string, RawQuestion[]>()
let officialTestCache: RawQuestion[] | null = null

export async function loadQuestionIndex(): Promise<IndexEntry[]> {
  if (indexCache) return indexCache
  const res = await fetch(INDEX_PATH)
  indexCache = (await res.json()) as IndexEntry[]
  return indexCache
}

export async function loadCategoryQuestions(
  categoryCode: string,
): Promise<RawQuestion[]> {
  if (categoryCache.has(categoryCode)) return categoryCache.get(categoryCode)!
  const res = await fetch(`${CATEGORIES}/${categoryCode}.json`)
  const questions = (await res.json()) as RawQuestion[]
  categoryCache.set(categoryCode, questions)
  return questions
}

export async function loadOfficialTests(): Promise<RawQuestion[]> {
  if (officialTestCache) return officialTestCache
  const res = await fetch(OFFICIAL_TESTS_PATH)
  officialTestCache = (await res.json()) as RawQuestion[]
  return officialTestCache
}

export function rawToQuestion(raw: RawQuestion, idx: IndexEntry): QuestionData {
  const prompt = raw.ocrPrompt || raw.prompt || "Зургийг ажиглаад зөв хариултыг сонгоно уу."
  const choices = raw.ocrChoices && raw.ocrChoices.length > 0
    ? raw.ocrChoices
    : raw.choices || []
  const correctIndex = raw.correctIndex ?? 0
  const difficulty = raw.difficulty || idx.difficulty || "standard"
  const imagePath = raw.imagePath || idx.imagePath

  return {
    id: raw.id || idx.id,
    prompt,
    choices,
    correctIndex: Math.min(correctIndex, Math.max(choices.length - 1, 0)),
    shortExplanation: raw.shortExplanation || "Энэ импортлогдсон асуулт.",
    longExplanation: raw.longExplanation || raw.shortExplanation || "",
    topic: raw.topic || "Traffic Institute",
    subtopic: raw.subtopic || idx.subtopic || "",
    difficulty: difficulty as "starter" | "standard" | "advanced",
    sourceType: raw.sourceType || "Traffic Institute APK import",
    tags: raw.tags || [],
    commonMistakeReason: raw.commonMistakeReason || "",
    premiumOnly: false,
    sourceGroup: idx.categoryCode?.startsWith("2") ? "plus" as const : "main" as const,
    pack: raw.pack || "Traffic Institute 1000",
    visual: imagePath
      ? {
          kind: (raw.visual?.kind || idx.visual?.kind || "sign") as any,
          title: raw.visual?.title || idx.visual?.title || raw.imageTitle || "",
          caption: raw.visual?.caption || idx.visual?.caption || "",
          assetPath: `${DATA_PREFIX}/app_ready/${imagePath}`,
        }
      : undefined,
  }
}

export interface QuestionData {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  shortExplanation: string
  longExplanation: string
  topic: string
  subtopic: string
  difficulty: "starter" | "standard" | "advanced"
  sourceType: string
  tags: string[]
  commonMistakeReason: string
  premiumOnly: boolean
  sourceGroup: "main" | "plus" | "officialTest"
  pack?: string
  visual?: {
    kind: string
    title: string
    caption: string
    assetPath?: string
  }
}

export function rawOfficialToQuestion(raw: any): QuestionData {
  const answers = (raw.answers || []).map((a: string) =>
    a.replace(/^\d+\.\s*/, "").trim(),
  ).filter(Boolean)
  const correctIndex = raw.correct_index ?? 0
  const imageUrl = raw.image_url

  return {
    id: `official_${raw.id || "question"}`,
    prompt: (raw.prompt || "Асуулт").replace(/\s+/g, " ").trim(),
    choices: answers,
    correctIndex: Math.min(correctIndex, Math.max(answers.length - 1, 0)),
    shortExplanation: `Зөв хариулт: ${answers[correctIndex] || "Зөв хариулт"}`,
    longExplanation: "Traffic Institute-ийн вэб тестийн цэвэрлэсэн асуултууд.",
    topic: "Official Test",
    subtopic: "Traffic Institute web test",
    difficulty: answers.length <= 2 ? "starter" as const : "standard" as const,
    sourceType: "Traffic Institute web test",
    tags: ["traffic-institute", "official-test", "clean-data"],
    commonMistakeReason: "Асуултын нөхцөл, зургийг бүрэн анзаарч бодох хэрэгтэй.",
    premiumOnly: false,
    sourceGroup: "officialTest" as const,
    pack: "Traffic Institute 1000",
    visual: imageUrl
      ? {
          kind: "sign",
          title: "",
          caption: "",
          assetPath: `${DATA_PREFIX}/mirror${urlPathOrEmpty(imageUrl)}`,
        }
      : undefined,
  }
}

function urlPathOrEmpty(url: string | undefined): string {
  if (!url) return ""
  try {
    return new URL(url).pathname
  } catch {
    return ""
  }
}

export function isTrafficInstituteBankId(id: string): boolean {
  return /^ti_apk_(\d{3})\d+$/.test(id)
}

export function categoryCodeFromQuestionId(id: string): string | null {
  const match = /^ti_apk_(\d{3})\d+$/.exec(id)
  return match?.[1] ?? null
}
