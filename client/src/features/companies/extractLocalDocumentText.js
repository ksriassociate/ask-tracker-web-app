// Browser-only extraction. No upload to Supabase Storage and no database write.
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { recognize } from "tesseract.js";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 30000;
const MAX_OCR_PAGES = 50;

async function recogniseImage(source) {
  const result = await recognize(source, "eng", {
    logger: () => undefined,
  });
  return String(result.data.text || "").trim();
}

async function pageAsCanvas(page) {
  // Higher resolution materially improves OCR on court/MCA scans and stamps.
  const viewport = page.getViewport({ scale: 3 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare the scanned PDF for OCR.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

function canvasToBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error("Could not render the PDF page."));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });
}

// Used only when OCR cannot read a scan. It preserves the source pages visually
// in a Word file; those page images themselves are not editable text.
export async function renderScannedPdfPages(file, limit = 50) {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let number = 1; number <= Math.min(pdf.numPages, limit); number += 1) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not render the scanned PDF.");
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push({ data: await canvasToBytes(canvas), width: viewport.width, height: viewport.height });
  }
  return pages;
}

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
      const selectableText = content.items.map((item) => item.str || "").join(" ").trim();
      if (selectableText.length >= 15) pages.push(selectableText);
      else if (number <= MAX_OCR_PAGES) {
        const ocrText = await recogniseImage(await pageAsCanvas(page));
        pages.push(ocrText || `[VERIFY: no readable OCR text detected on scanned page ${number}]`);
      }
      else pages.push("[VERIFY: additional scanned PDF pages were not OCR processed]");
    }
    return pages.join("\n\n").slice(0, MAX_TEXT_CHARS);
  }
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return (await recogniseImage(file)).slice(0, MAX_TEXT_CHARS);
  }
  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value.slice(0, MAX_TEXT_CHARS);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return workbook.SheetNames.map((sheet) => `Sheet: ${sheet}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[sheet])}`).join("\n\n").slice(0, MAX_TEXT_CHARS);
  }
  throw new Error("Supported temporary file types are PDF, PNG, JPG, DOCX, XLSX, XLS, TXT, and CSV.");
}
