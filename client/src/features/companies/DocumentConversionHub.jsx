import React, { useState } from "react";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { extractLocalDocumentText } from "./extractLocalDocumentText";

const safeName = (file) => file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "_") || "firmaxis_document";

export default function DocumentConversionHub() {
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clear = () => {
    setFile(null); setText(""); setMessage(""); setError(""); setInputKey((key) => key + 1);
  };

  const extract = async () => {
    if (!file) return setError("Choose a document first.");
    setBusy(true); setError(""); setMessage(""); setText("");
    try {
      const result = await extractLocalDocumentText(file);
      setText(result);
      setMessage("Copyable text extracted locally. Review it before downloading the Word file.");
    } catch (err) {
      setError(err.message || "Document conversion failed.");
    } finally {
      setBusy(false);
    }
  };

  const downloadWord = async () => {
    if (!file || !text.trim()) return;
    setBusy(true); setError("");
    try {
      const word = new Document({
        sections: [{
          children: [
            new Paragraph({ text: "ProAxis — Editable Document Copy", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ children: [new TextRun({ text: `Source file: ${file.name}`, italics: true })] }),
            new Paragraph({ children: [new TextRun({ text: "OCR output must be reviewed against the original before filing or use.", italics: true })] }),
            ...text.split(/\r?\n/).map((line) => new Paragraph({ text: line || " " })),
          ],
        }],
      });
      saveAs(await Packer.toBlob(word), `${safeName(file)}_editable.docx`);
      setMessage("Editable Word document downloaded.");
    } catch (err) {
      setError(err.message || "Could not create the Word document.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Local document utility</p>
        <h1 className="mt-2 text-2xl font-black">Document Conversion Hub</h1>
        <p className="mt-1 text-xs text-slate-400">Extract copyable text from MCA, tax, litigation and client documents without uploading the source file.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 xl:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select source document</h2>
          <input
            key={inputKey}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.xls,.txt,.csv"
            onChange={(event) => { setFile(event.target.files?.[0] || null); setText(""); setMessage(""); setError(""); }}
            className="mt-4 text-xs"
          />
          {file && <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs"><span>{file.name} · {Math.ceil(file.size / 1024)} KB</span><button onClick={clear} className="rounded border border-slate-600 px-2 py-1 text-[10px] font-bold">Remove</button></div>}
          <div className="mt-4 rounded-lg border border-indigo-900 bg-indigo-950/40 p-3 text-[11px] leading-relaxed text-indigo-100">
            <b>Supported:</b> PDF, scanned PDF, PNG, JPG, DOCX, XLS/XLSX, TXT and CSV.<br />
            <b>Scan limit:</b> only the first 50 PDF pages are processed locally.<br />
            <b>Output:</b> only recognised, selectable text can be downloaded as Word — no empty or image-only Word files.<br />
            <b>Privacy:</b> the source file is never uploaded or stored.
          </div>
          {error && <p className="mt-3 rounded bg-rose-950 p-3 text-xs text-rose-200">{error}</p>}
          {message && <p className="mt-3 rounded bg-emerald-950 p-3 text-xs text-emerald-200">{message}</p>}
          <button disabled={!file || busy} onClick={extract} className="mt-4 w-full rounded bg-indigo-600 py-2.5 text-xs font-bold uppercase disabled:opacity-50">{busy ? "Processing locally…" : "Extract editable text"}</button>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 xl:col-span-3">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Editable text preview</h2><p className="mt-1 text-[10px] text-slate-500">Correct OCR errors before downloading.</p></div><button disabled={!text.trim() || busy} onClick={downloadWord} className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold disabled:opacity-50">Download Word (.docx)</button></div>
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Choose a document and select Extract editable text…" className="mt-4 h-[480px] w-full rounded border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-200" />
        </section>
      </div>
    </div>
  );
}
