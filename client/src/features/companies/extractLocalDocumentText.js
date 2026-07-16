// Browser-only extraction. No upload to Supabase Storage and no database write.
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 30000;

export async function extractLocalDocumentText(file) {
  if (!file) return "";
  if (file.size > MAX_FILE_BYTES) throw new Error("Choose a file smaller than 5 MB for temporary AI processing.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".csv")) return (await file.text()).slice(0, MAX_TEXT_CHARS);
  if (name.endsWith(".pdf")) {
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = [];
    for (let number = 1; number <= Math.min(pdf.numPages, 30); number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str || "").join(" "));
    }
    return pages.join("\n\n").slice(0, MAX_TEXT_CHARS);
  }
  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.slice(0, MAX_TEXT_CHARS);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return workbook.SheetNames.map((sheet) => `Sheet: ${sheet}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[sheet])}`).join("\n\n").slice(0, MAX_TEXT_CHARS);
  }
  throw new Error("Supported temporary file types are PDF, DOCX, XLSX, XLS, TXT, and CSV. Scanned image PDFs need OCR and are not processed in this version.");
}
