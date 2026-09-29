export interface CohortPattern {
  name: string;
  designer?: string;
}

export interface CohortProfile {
  mode: "main" | "holdout";
  patternCount: number;
  designerCount: number;
  eligible: boolean;
  issues: string[];
}

const MIN_MAIN_PATTERNS = 10;
const MIN_MAIN_DESIGNERS = 6;
const MIN_HOLDOUT_PATTERNS = 5;

function designerKey(designer: string | undefined): string | null {
  const normalized = designer?.trim().toLocaleLowerCase("en-US");
  return normalized ? normalized : null;
}

function designerSet(patterns: CohortPattern[]): Set<string> {
  return new Set(
    patterns
      .map((pattern) => designerKey(pattern.designer))
      .filter((designer): designer is string => designer !== null),
  );
}

function missingDesignerNames(patterns: CohortPattern[]): string[] {
  return patterns
    .filter((pattern) => designerKey(pattern.designer) === null)
    .map((pattern) => pattern.name);
}

export function evaluateMainCohort(patterns: CohortPattern[]): CohortProfile {
  const designers = designerSet(patterns);
  const missing = missingDesignerNames(patterns);
  const issues: string[] = [];
  if (patterns.length < MIN_MAIN_PATTERNS) {
    issues.push(`requires at least ${MIN_MAIN_PATTERNS} patterns (found ${patterns.length})`);
  }
  if (designers.size < MIN_MAIN_DESIGNERS) {
    issues.push(
      `requires at least ${MIN_MAIN_DESIGNERS} distinct designers (found ${designers.size})`,
    );
  }
  if (missing.length > 0) {
    issues.push(`designer is missing from ${missing.length} truth file(s)`);
  }
  return {
    mode: "main",
    patternCount: patterns.length,
    designerCount: designers.size,
    eligible: issues.length === 0,
    issues,
  };
}

export function evaluateHoldoutCohort(
  patterns: CohortPattern[],
  mainPatterns: CohortPattern[],
): CohortProfile {
  const designers = designerSet(patterns);
  const mainDesigners = designerSet(mainPatterns);
  const missing = missingDesignerNames(patterns);
  const issues: string[] = [];

  if (patterns.length < MIN_HOLDOUT_PATTERNS) {
    issues.push(`requires at least ${MIN_HOLDOUT_PATTERNS} patterns (found ${patterns.length})`);
  }
  if (mainPatterns.length === 0) {
    issues.push("the main cohort has no truth files");
  }
  if (mainPatterns.some((pattern) => designerKey(pattern.designer) === null)) {
    issues.push("the main cohort has truth files without a recorded designer");
  }
  if (missing.length > 0) {
    issues.push(`designer is missing from ${missing.length} holdout truth file(s)`);
  }
  const sharedDesigners = [...designers].filter((designer) => mainDesigners.has(designer));
  if (sharedDesigners.length > 0) {
    issues.push(`shares designer(s) with the main cohort: ${sharedDesigners.join(", ")}`);
  }

  return {
    mode: "holdout",
    patternCount: patterns.length,
    designerCount: designers.size,
    eligible: issues.length === 0,
    issues,
  };
}
