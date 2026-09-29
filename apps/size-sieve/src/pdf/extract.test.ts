import { describe, expect, it, vi } from "vitest";
import { extractPdfText, PdfExtractionError } from "./extract.ts";

const encoder = new TextEncoder();

function escapePdfString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textAt(x: number, y: number, value: string): string {
  return `BT /F1 12 Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfString(value)}) Tj ET\n`;
}

function makePdf(pageContents: string[]): Uint8Array {
  const objects = new Map<number, string>();
  const pageReferences: string[] = [];
  const fontId = 3 + pageContents.length * 2;

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  for (let index = 0; index < pageContents.length; index += 1) {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    pageReferences.push(`${pageId} 0 R`);
    objects.set(
      pageId,
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 " +
        fontId +
        " 0 R >> >> /Contents " +
        contentId +
        " 0 R >>",
    );
    const content = pageContents[index] ?? "";
    objects.set(
      contentId,
      `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`,
    );
  }
  objects.set(
    2,
    "<< /Type /Pages /Kids [" +
      pageReferences.join(" ") +
      "] /Count " +
      pageContents.length +
      " >>",
  );
  objects.set(fontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const objectCount = fontId + 1;
  let body = "%PDF-1.4\n";
  const offsets = new Array<number>(objectCount).fill(0);
  for (let id = 1; id < objectCount; id += 1) {
    const object = objects.get(id);
    if (object === undefined) throw new Error(`Missing synthetic PDF object ${id}`);
    offsets[id] = encoder.encode(body).length;
    body += `${id} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(body).length;
  body += `xref\n0 ${objectCount}\n0000000000 65535 f \n`;
  for (let id = 1; id < objectCount; id += 1) {
    body += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return encoder.encode(body);
}

describe("extractPdfText", () => {
  it("rebuilds multiple lines and inserts a space only when separate items have a gap", async () => {
    const page =
      textAt(72, 720, "Cast") +
      textAt(101, 720, "on") +
      textAt(72, 700, "ab") +
      textAt(85, 700, "cd");
    await expect(extractPdfText(makePdf([page]))).resolves.toBe("Cast on\nabcd");
  });

  it("separates pages with a blank line and reports progress in page order", async () => {
    const progress = vi.fn();
    const pdf = makePdf([textAt(72, 720, "First page"), textAt(72, 720, "Second page")]);
    await expect(extractPdfText(pdf, progress)).resolves.toBe("First page\n\nSecond page");
    expect(progress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it("throws the scanned-PDF error when a document has no extractable text", async () => {
    await expect(extractPdfText(makePdf([""]))).rejects.toMatchObject({
      name: "PdfExtractionError",
      code: "no-text-layer",
    });
  });

  it("throws a typed invalid-PDF error for corrupt bytes", async () => {
    const invalid = encoder.encode("not a PDF");
    await expect(extractPdfText(invalid)).rejects.toBeInstanceOf(PdfExtractionError);
    await expect(extractPdfText(invalid)).rejects.toMatchObject({ code: "invalid-pdf" });
  });
});
