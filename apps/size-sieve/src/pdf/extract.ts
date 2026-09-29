type PdfJsModule = Pick<typeof import("pdfjs-dist"), "getDocument" | "GlobalWorkerOptions">;

export type PdfExtractionErrorCode = "no-text-layer" | "password-protected" | "invalid-pdf";

export class PdfExtractionError extends Error {
  readonly code: PdfExtractionErrorCode;

  constructor(code: PdfExtractionErrorCode, message: string, cause?: unknown) {
    if (cause === undefined) {
      super(message);
    } else {
      super(message, { cause });
    }
    this.name = "PdfExtractionError";
    this.code = code;
  }
}

interface LineBuffer {
  text: string;
  y: number;
  endX: number;
  fontSize: number;
}

async function loadPdfJs(): Promise<PdfJsModule> {
  if (typeof window === "undefined") {
    // PDF.js recommends its legacy entry in Node. Keep the path dynamic so Vite does not bundle
    // this Node-only build, which contains a CSP-incompatible global lookup polyfill.
    const nodeEntry = "pdfjs-dist/legacy/build/pdf.mjs";
    return (await import(/* @vite-ignore */ nodeEntry)) as PdfJsModule;
  }

  const pdfjs = await import("./browser-pdfjs.ts");
  const worker = await import("./browser-worker.ts");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

function addTextItem(
  lines: string[],
  buffer: LineBuffer | null,
  item: {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hasEOL: boolean;
  },
): LineBuffer | null {
  if (
    buffer &&
    Math.abs(item.y - buffer.y) > Math.max(1.5, Math.min(buffer.fontSize, item.height) * 0.25)
  ) {
    lines.push(buffer.text);
    buffer = null;
  }

  if (!buffer) {
    buffer = {
      text: item.str,
      y: item.y,
      endX: item.x + item.width,
      fontSize: item.height,
    };
  } else {
    const gap = item.x - buffer.endX;
    const spaceThreshold = Math.max(1, Math.min(buffer.fontSize, item.height) * 0.2);
    if (gap > spaceThreshold && !/\s$/.test(buffer.text) && !/^\s/.test(item.str)) {
      buffer.text += " ";
    }
    buffer.text += item.str;
    buffer.endX = item.x + item.width;
    buffer.fontSize = Math.max(buffer.fontSize, item.height);
  }

  if (item.hasEOL) {
    lines.push(buffer.text);
    return null;
  }
  return buffer;
}

function pageText(items: Array<unknown>): string {
  const lines: string[] = [];
  let buffer: LineBuffer | null = null;

  for (const item of items) {
    if (typeof item !== "object" || item === null || !("str" in item)) continue;
    const textItem = item as {
      str: unknown;
      hasEOL?: unknown;
      transform?: unknown;
      width?: unknown;
      height?: unknown;
    };
    if (typeof textItem.str !== "string") continue;
    const transform = Array.isArray(textItem.transform) ? textItem.transform : [];
    const numberAt = (index: number, fallback: number): number => {
      const value = Number(transform[index]);
      return Number.isFinite(value) ? value : fallback;
    };
    const heightValue = Number(textItem.height);
    const transformHeight = Math.abs(numberAt(3, 0));
    const height = Math.max(
      1,
      Number.isFinite(heightValue) && heightValue > 0 ? heightValue : transformHeight,
    );

    buffer = addTextItem(lines, buffer, {
      str: textItem.str,
      x: numberAt(4, 0),
      y: numberAt(5, 0),
      width: Number.isFinite(Number(textItem.width)) ? Number(textItem.width) : 0,
      height,
      hasEOL: textItem.hasEOL === true,
    });
  }

  if (buffer) lines.push(buffer.text);
  return lines.join("\n");
}

function classifyPdfError(error: unknown): PdfExtractionError {
  if (error instanceof PdfExtractionError) return error;
  const name =
    typeof error === "object" && error !== null && "name" in error ? String(error.name) : "";
  const message = error instanceof Error ? error.message : String(error);
  if (name === "PasswordException" || /password|encrypted/i.test(message)) {
    return new PdfExtractionError("password-protected", "This PDF is password protected.", error);
  }
  return new PdfExtractionError("invalid-pdf", "This PDF is invalid or corrupt.", error);
}

/**
 * Extracts document-order text, using PDF.js line endings and item coordinates to restore lines.
 * The Node branch exists for the local feasibility harness; the browser branch owns its worker.
 */
export async function extractPdfText(
  data: ArrayBuffer | Uint8Array,
  onProgress?: (page: number, pages: number) => void,
): Promise<string> {
  const pdfData =
    data instanceof ArrayBuffer ? new Uint8Array(data.slice(0)) : new Uint8Array(data);
  let task: ReturnType<PdfJsModule["getDocument"]> | undefined;

  try {
    const pdfjs = await loadPdfJs();
    // PDF.js 6.3.289 has no isEvalSupported parameter; its standard browser files contain no eval call.
    task = pdfjs.getDocument({
      data: pdfData,
      useWasm: false,
      useWorkerFetch: false,
    });
    const document = await task.promise;
    if (document.numPages < 1) {
      throw new PdfExtractionError("invalid-pdf", "This PDF is invalid or corrupt.");
    }
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(pageText(content.items));
      onProgress?.(pageNumber, document.numPages);
    }

    const text = pages.join("\n\n");
    if (text.trim().length === 0) {
      throw new PdfExtractionError(
        "no-text-layer",
        "This PDF has no text layer (it may be scanned).",
      );
    }
    return text;
  } catch (error) {
    throw classifyPdfError(error);
  } finally {
    if (task) {
      await task.destroy().catch(() => undefined);
    }
  }
}
