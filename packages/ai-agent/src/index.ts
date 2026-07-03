export { chatCompletion, structuredCompletion } from "./client";
export { generateEveningReport } from "./report-gen";
export { nlQuery } from "./nl-query";
export { categorizeExpense } from "./categorize";
export { runWithTools } from "./tool-runner";
export type {
  ReportInput,
  NLQueryInput,
  NLQueryResult,
  CategorizeInput,
  CategorizeResult,
  AiOptions,
  Tool,
  ToolParam,
  ToolResult,
} from "./types";
