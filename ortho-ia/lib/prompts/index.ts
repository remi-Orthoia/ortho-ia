export { buildSystemPrompt, type CRBOPhase, type CRBOFormat } from './system-base'
export { buildCRBOPrompt, buildExtractPrompt, buildSynthesizePrompt, type SynthesizePromptInput } from './user-prompt'
export {
  EXTRACTION_PROMPT,
  EXTRACT_TOOL,
  extractedToLegacyText,
  type ExtractedResults,
} from './extraction'
export { CRBO_TOOL, EXTRACT_CRBO_TOOL, SYNTHESIZE_TOOL } from './tool-schema'
export type {
  CRBOStructure,
  CRBODomain,
  CRBOEpreuve,
  ExtractedCRBO,
  SynthesizedCRBO,
  SyntheseEvolution,
  SeveriteGlobale,
  ReasoningClinical,
} from './tool-schema'
export { TEST_REGISTRY, getTestModule } from './tests'
export type { TestModule } from './tests'
