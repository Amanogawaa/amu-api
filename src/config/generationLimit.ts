export const GENERATION_LIMITS = {
  MAX_MODULES: 5,
  MAX_CHAPTERS_PER_MODULE: 4,
  MAX_LESSONS_PER_CHAPTER: 4,
  MAX_QUIZ_QUESTIONS: 5,

  BATCH_SIZE: 3,

  MAX_TOKENS_PER_REQUEST: 8000,

  BATCH_DELAY: 2000,
};

export function enforceLimit(
  requested: number,
  max: number,
  itemName: string
): number {
  if (requested > max) {
    console.warn(`Requested ${requested} ${itemName}, limiting to ${max}`);
    return max;
  }
  return requested;
}
