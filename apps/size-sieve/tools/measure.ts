import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  type CohortPattern,
  evaluateHoldoutCohort,
  evaluateMainCohort,
} from "../src/gate/cohort.ts";
import {
  analyzePattern,
  calculateGateCriteria,
  inspectResolutions,
  type PatternAnalysis,
} from "../src/gate/measure.ts";
import {
  type PatternFailure,
  renderErrorReport,
  renderPatternReport,
  renderSummaryReport,
} from "../src/gate/reports.ts";
import { parseTruthFile } from "../src/gate/truth.ts";
import { findSizeList, resolve } from "../src/parser/index.ts";
import { extractPdfText, PdfExtractionError } from "../src/pdf/extract.ts";

const DEFAULT_FOLDER = "apps/size-sieve/.feasibility/";
const TRUTH_SUFFIX = ".truth.json";

interface MeasureArgs {
  folder: string;
  holdoutFolder?: string;
}

function parseMeasureArgs(args: string[]): MeasureArgs {
  const positionals: string[] = [];
  let holdoutFolder: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--holdout") {
      const value = args[index + 1];
      if (!value || value.startsWith("--") || holdoutFolder !== undefined) {
        throw new Error("Usage: node tools/measure.ts <folder> [--holdout <main-cohort-folder>]");
      }
      holdoutFolder = value;
      index += 1;
    } else if (argument?.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (argument) {
      positionals.push(argument);
    }
  }
  if (positionals.length > 1) {
    throw new Error("Usage: node tools/measure.ts <folder> [--holdout <main-cohort-folder>]");
  }
  return {
    folder: positionals[0] ?? DEFAULT_FOLDER,
    ...(holdoutFolder ? { holdoutFolder } : {}),
  };
}

async function cohortPatterns(folder: string): Promise<CohortPattern[]> {
  const truthNames = (await readdir(folder))
    .filter((name) => name.endsWith(TRUTH_SUFFIX))
    .sort((left, right) => left.localeCompare(right));
  const patterns: CohortPattern[] = [];
  for (const truthName of truthNames) {
    const name = path.basename(truthName, TRUTH_SUFFIX);
    try {
      const truthFile = parseTruthFile(await readFile(path.join(folder, truthName), "utf8"));
      patterns.push({ name, ...(truthFile.designer ? { designer: truthFile.designer } : {}) });
    } catch {
      // Keep malformed annotations in the profile as patterns without designer evidence.
      patterns.push({ name });
    }
  }
  return patterns;
}

async function measureOne(folder: string, truthPath: string): Promise<PatternAnalysis> {
  const name = path.basename(truthPath, TRUTH_SUFFIX);
  const truthFile = parseTruthFile(await readFile(truthPath, "utf8"));
  const sourcePath = path.join(folder, truthFile.file);
  const extension = path.extname(truthFile.file).toLowerCase();
  let text: string;

  if (extension === ".pdf") {
    text = await extractPdfText(await readFile(sourcePath));
  } else if (extension === ".txt") {
    text = await readFile(sourcePath, "utf8");
  } else {
    throw new Error("Source file must end in .pdf or .txt.");
  }

  const detected = findSizeList(text);
  const options = {
    count: truthFile.sizeCount,
    usesDashes: detected?.usesDashes ?? false,
    ...(detected ? { sizeListLine: detected.lineIndex } : {}),
  };
  const resolutions = Array.from({ length: truthFile.sizeCount }, (_, chosenIndex) =>
    resolve(text, options, chosenIndex),
  );
  const inspected = inspectResolutions(text, resolutions);
  const analysis = analyzePattern({
    name,
    sizeCount: truthFile.sizeCount,
    detectedSizeCount: detected?.count ?? null,
    truth: truthFile.sequences,
    sequences: inspected.sequences,
    extractedText: text,
    structure: inspected.structure,
  });

  await writeFile(
    path.join(folder, `${name}.report.md`),
    renderPatternReport(analysis, truthFile, text),
    "utf8",
  );
  return analysis;
}

function errorMessage(error: unknown): string {
  if (error instanceof PdfExtractionError) return error.message;
  return error instanceof Error ? error.message : String(error);
}

function errorCause(error: unknown): string | undefined {
  if (!(error instanceof PdfExtractionError) || error.cause === undefined) return undefined;
  if (error.cause instanceof Error) return `${error.cause.name}: ${error.cause.message}`;
  return String(error.cause);
}

async function main(): Promise<void> {
  const args = parseMeasureArgs(process.argv.slice(2));
  const folder = path.resolve(process.cwd(), args.folder);
  const holdoutFolder = args.holdoutFolder
    ? path.resolve(process.cwd(), args.holdoutFolder)
    : undefined;
  await mkdir(folder, { recursive: true });
  const truthNames = (await readdir(folder))
    .filter((name) => name.endsWith(TRUTH_SUFFIX))
    .sort((left, right) => left.localeCompare(right));
  const analyses: PatternAnalysis[] = [];
  const failures: PatternFailure[] = [];

  for (const truthName of truthNames) {
    const truthPath = path.join(folder, truthName);
    const name = path.basename(truthName, TRUTH_SUFFIX);
    try {
      analyses.push(await measureOne(folder, truthPath));
    } catch (error) {
      const message = errorMessage(error);
      const cause = errorCause(error);
      failures.push({ name, message, ...(cause ? { cause } : {}) });
      await writeFile(
        path.join(folder, `${name}.report.md`),
        renderErrorReport(name, message, cause),
        "utf8",
      );
    }
  }

  const cohortProfile = holdoutFolder
    ? evaluateHoldoutCohort(await cohortPatterns(folder), await cohortPatterns(holdoutFolder))
    : evaluateMainCohort(await cohortPatterns(folder));

  await writeFile(
    path.join(folder, "summary.md"),
    renderSummaryReport(analyses, failures, truthNames.length, cohortProfile),
    "utf8",
  );
  console.log(`Measured ${analyses.length} pattern(s); ${failures.length} error(s).`);
  console.log(`Reports: ${folder}`);

  if (failures.length > 0) {
    process.exitCode = 1;
    console.log("NO VERDICT: one or more truth files or sources could not be measured.");
    return;
  }
  if (!cohortProfile.eligible) {
    console.log(`NO VERDICT: ${cohortProfile.issues.join("; ")}.`);
    return;
  }
  const criteria = calculateGateCriteria(
    analyses.map((analysis) => ({
      name: analysis.name,
      counted: analysis.counts.counted,
      correct: analysis.counts.correct,
      wrong: analysis.counts.wrong,
      structurePassed: analysis.structure.passed,
    })),
  );
  if (criteria.evaluated && !criteria.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
