export { buildSystemPrompt } from './system-base'
export { buildCRBOPrompt } from './user-prompt'
export {
  EXTRACTION_PROMPT,
  EXTRACT_TOOL,
  extractedToLegacyText,
  type ExtractedResults,
} from './extraction'
export { CRBO_TOOL } from './tool-schema'
export type { CRBOStructure, CRBODomain, CRBOEpreuve } from './tool-schema'
export { TEST_REGISTRY, getTestModule } from './tests'
export type { TestModule } from './tests'
