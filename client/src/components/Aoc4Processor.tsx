import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileText, Sparkles, Upload, Loader2, ClipboardCheck, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export const Aoc4Processor = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<string | null>(null);

  // Default Template Config matching your exact 19-point audit checklist structure
  const [templateConfig, setTemplateConfig] = useState(
    JSON.stringify(
      {
        "1_company_name": "Extract full name of the company from Balance Sheet heading",
        "2_corporate_identity_number_cin": "Extract 21-digit CIN string from financial statements",
        "3_date_of_signing": "Date when Balance Sheet is signed (below Directors/Auditors signatures)",
        "4_directors_signing_financial_statements": "Name of Director(s) with DIN (Format: DIN XXXXXXXX – Name)",
        "5_holding_subsidiary_status": "Whether the company is a subsidiary. Name of shareholder holding more than 51% (check Notes -> Share Capital -> Shareholding Pattern)",
        "6_nature_of_holding_company": "Based on shareholder identification, infer or look up whether Holding Company is Indian or Foreign",
        "7_auditor_details": "Auditor Name, Firm Registration No., Membership No., and professional firm address",
        "8_financial_year": "Current Financial Year and Previous Financial Year format matching Balance Sheet heading",
        "balance_sheet_liabilities": {
          "9a_share_capital": "Amount in ₹",
          "9b_reserves_and_surplus": "Amount in ₹",
          "9c_money_received_against_share_warrants": "Amount in ₹",
          "9d_long_term_borrowings": "Amount in ₹",
          "9e_deferred_tax_liabilities_net": "Amount in ₹",
          "9f_other_long_term_liabilities": "Amount in ₹",
          "9g_long_term_provisions": "Amount in ₹",
          "9h_short_term_borrowings": "Amount in ₹",
          "9i_trade_payables": "Amount in ₹",
          "9j_trade_payables_break_up": "MSME Dues vs Other than MSME Dues break-up details (Notes to Trade Payables)",
          "9k_other_current_liabilities": "Amount in ₹",
          "9l_short_term_provisions": "Amount in ₹",
          "9m_total_liabilities": "Total balance sum line item"
        },
        "balance_sheet_assets": {
          "10a_property_plant_and_equipment": "Amount in ₹",
          "10b_intangible_assets": "Amount in ₹",
          "10c_capital_work_in_progress": "Amount in ₹",
          "10d_intangible_assets_under_development": "Amount in ₹",
          "10e_non_current_investments": "Amount in ₹",
          "10f_deferred_tax_assets_net": "Amount in ₹",
          "10g_long_term_loans_and_advances": "Amount in ₹",
          "10h_other_non_current_assets": "Amount in ₹",
          "10i_current_investments": "Amount in ₹",
          "10j_inventories": "Amount in ₹",
          "10k_trade_receivables": "Amount in ₹",
          "10l_cash_and_cash_equivalents": "Amount in ₹",
          "10m_short_term_loans_and_advances": "Amount in ₹",
          "10n_other_current_assets": "Amount in ₹"
        },
        "long_term_borrowings_note_breakup": {
          "11a_bonds_debentures": "Amount in ₹",
          "11b_term_loans_from_banks": "Amount in ₹",
          "11c_term_loans_from_others": "Amount in ₹",
          "11d_deferred_payment_liabilities": "Amount in ₹",
          "11e_deposits": "Amount in ₹",
          "11f_loans_and_advances_from_related_parties": "Amount in ₹",
          "11g_long_term_maturities_of_finance_lease_obligations": "Amount in ₹",
          "11h_other_loans_and_advances": "Amount in ₹",
          "11i_total_long_term_borrowings_unsecured": "Sum total"
        },
        "short_term_borrowings_note_breakup": {
          "12a_loans_repayable_on_demand_from_banks": "Amount in ₹",
          "12b_loans_repayable_on_demand_from_other_parties": "Amount in ₹",
          "12c_loans_and_advances_from_related_parties": "Amount in ₹",
          "12d_deposits": "Amount in ₹",
          "12e_other_loans_and_advances": "Amount in ₹",
          "12f_total_short_term_borrowings_unsecured": "Sum total"
        },
        "long_term_loans_and_advances_breakup": {
          "13a_nature": "Unsecured Considered Good / Secured / Doubtful classification notes",
          "13b_capital_advances": "Amount in ₹",
          "13c_loans_and_advances_to_related_parties": "Amount in ₹",
          "13d_other_loans_and_advances": "Amount in ₹",
          "13e_total_long_term_loans_and_advances": "Sum total",
          "13f_less_provisions_allowances_for_bad_debts": "Deduction balance",
          "13g_net_long_term_loans_and_advances": "Net position",
          "13h_loans_due_by_directors_or_officers": "Amount in ₹"
        },
        "trade_receivables_breakup": {
          "14a_secured_considered_good": "Amount in ₹",
          "14b_unsecured_considered_good": "Amount in ₹",
          "14c_doubtful": "Amount in ₹",
          "14d_total_trade_receivables": "Sum (a+b+c)",
          "14e_less_provision_for_bad_debts": "Deduction entry",
          "14f_net_trade_receivables": "Net position (d-e)",
          "14g_receivables_due_from_directors_or_officers": "Amount in ₹"
        },
        "analytical_checks": {
          "15_share_capital_reduction_check": "Compare previous year share capital with current. If Prev > Current, verify buy-back execution (Yes/No with details)",
          "16_subsidiary_investment_check": "Check Investment Notes for investments in subsidiary units and extract absolute entity names",
          "17_calculated_net_worth": "Calculate and report absolute sum (Share Capital + Reserves & Surplus)",
          "18_share_capital_expansion_check": "Compare previous year share capital with current. If Current > Prev, extract amount issued during year",
          "19_additional_observations_and_remarks": "General compliance audit text notes or processing notes from review analysis context"
        }
      },
      null,
      2
    )
  );

  const parseExcelFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          let fullText = "";
          workbook.SheetNames.forEach((sheetName) => {
            fullText += `--- Sheet: ${sheetName} ---\n`;
            const sheet = workbook.Sheets[sheetName];
            fullText += XLSX.utils.sheet_to_txt(sheet) + "\n\n";
          });
          resolve(fullText);
        } catch (err) {
          reject(new Error("Failed to extract data structure out of Excel file layout."));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseWordFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (err) {
          reject(new Error("Failed to compile layout text out of Word document container."));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const fileToBase64Part = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(",")[1];
        resolve({ inlineData: { data: base64Data, mimeType: file.type } });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const flattenExtractionData = (dataObj: any): Array<{ Particulars: string; Value: any }> => {
    const rows: Array<{ Particulars: string; Value: any }> = [];
    const recurse = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          rows.push({ Particulars: `--- ${key.toUpperCase().replace(/_/g, " ")} ---`, Value: "" });
          recurse(obj[key]);
        } else {
          rows.push({ Particulars: key.replace(/_/g, " "), Value: obj[key] });
        }
      }
    };
    recurse(dataObj);
    return rows;
  };

  const getDynamicFilename = (fallback: string): string => {
    try {
      const parsed = getCleanedJsonData(extractedData || "{}");
      if (parsed["1_company_name"] && parsed["1_company_name"] !== "null") {
        return parsed["1_company_name"].replace(/[^a-z0-9]/gi, '_').toLowerCase();
      }
    } catch (e) {}
    return fallback;
  };

  // Sanitizer: Strips out markdown syntax backticks ```json ... ``` seamlessly
  const getCleanedJsonData = (rawText: string) => {
    let cleanText = rawText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, "");
      cleanText = cleanText.replace(/```$/, "");
    }
    return JSON.parse(cleanText.trim());
  };

  const handleExportToExcel = () => {
    if (!extractedData) return;
    try {
      const parsed = getCleanedJsonData(extractedData);
      const flatRows = flattenExtractionData(parsed);

      const worksheet = XLSX.utils.json_to_sheet(flatRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Checklist");

      worksheet["!cols"] = [{ wch: 50 }, { wch: 40 }];

      XLSX.writeFile(workbook, `${getDynamicFilename("audit_extract")}_checklist.xlsx`);
    } catch (err) {
      alert("Failed to build Excel sheet output: Parse variant error.");
    }
  };

  const handleExportToWord = () => {
    if (!extractedData) return;
    try {
      const parsed = getCleanedJsonData(extractedData);
      const flatRows = flattenExtractionData(parsed);

      let tableRowsHtml = flatRows
        .map((row) => {
          const isHeader = row.Particulars.startsWith("---");
          return `
          <tr style="${isHeader ? "background-color: #f1f5f9; font-weight: bold;" : ""}">
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 60%;">${row.Particulars}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; width: 40%;">${row.Value ?? "Nil / Not Found"}</td>
          </tr>`;
        })
        .join("");

      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>Financial Review Checklist</title>
        <style>
          body { font-family: "Calibri", sans-serif; margin: 20px; }
          h2 { color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        </style>
        </head>
        <body>
          <h2>Financial Statement Review Analysis Ledger</h2>
          <p>Generated via Internal AI Extraction Panel Framework</p>
          <table>
            <thead>
              <tr style="background-color: #4f46e5; color: white; font-weight: bold;">
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Particulars Checklist Item</th>
                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Extracted Amount / Findings</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${getDynamicFilename("audit_extract")}_checklist.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to build Word report output document container.");
    }
  };

  const handleProcessDocument = async () => {
    if (!file) return;

    try {
      JSON.parse(templateConfig);
    } catch (e) {
      alert("Invalid Destination Template Structure. Ensure text is valid JSON config string.");
      return;
    }

    setProcessing(true);
    setExtractedData(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing structural configuration tokens inside local workspace environments.");
      }

      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

      let contentsPayload: any[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === "xlsx" || fileExtension === "xls") {
        const textDump = await parseExcelFile(file);
        contentsPayload.push(`Here is raw balance metric context sheets extracted out of a tracking file data dump:\n\n${textDump}`);
      } else if (fileExtension === "docx") {
        const textDump = await parseWordFile(file);
        contentsPayload.push(`Here is corporate document text compiled out of the word document target container:\n\n${textDump}`);
      } else if (file.type === "application/pdf" || file.type.startsWith("image/")) {
        const base64Part = await fileToBase64Part(file);
        contentsPayload.push(base64Part);
      } else {
        const textContext = await file.text();
        contentsPayload.push(textContext);
      }

      const basePrompt = `
        You are a senior accounting compliance system and auditing intelligence expert tracking MCA corporate records.
        Review the attached financial statement file data thoroughly. Your objective is to extract metrics and fill out the provided destination map layout configuration accurately.
        
        REQUIRED OUTPUT MAP LAYOUT SCHEMA (JSON DICTIONARY MATRIX):
        ${templateConfig}

        RULES FOR PROCESSING:
        1. Keep output formatting strictly structured in raw JSON matching the dictionary key fields provided. Do not invent keys or omit sections.
        2. Do not wrap the JSON output blocks inside markdown syntax like \`\`\`json. Return ONLY a pure raw parsable string context.
        3. Extract amounts in absolute numerical values or text layouts exactly as requested in the instructions.
        4. If a field is not mentioned or available in the document context, set its output value parameter to null.
      `;

      contentsPayload.unshift(basePrompt);

      const result = await model.generateContent(contentsPayload);
      setExtractedData(result.response.text().trim());
    } catch (err: any) {
      alert("AI Processing Terminal Malfunction: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* MODULE MAIN BRANDING PANEL */}
      <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Financial Statement Review Engine</h2>
          <p className="text-xs text-gray-500">Upload corporate documents (PDF, Excel, Word, or images) to run automated balance and compliance data mappings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* OPERATIONAL PARAMETER ENGINE CONTROLS */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 space-y-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-gray-400">Step 1: Choose File Asset Target</h3>
            <label className="border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50/50 hover:bg-white transition rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer group text-center">
              <input type="file" accept="application/pdf,image/*,.xlsx,.xls,.docx,.txt,.csv" className="hidden" onChange={handleFileChange} />
              <Upload className="w-8 h-8 text-gray-300 group-hover:text-indigo-500 mb-2 transition" />
              <span className="text-sm font-semibold text-gray-700">{file ? file.name : "Drop Audit File Sheet Here"}</span>
              <span className="text-[11px] text-gray-400 mt-1">Accepts any format including PDFs, Excel sheets, Word files, or Scans</span>
            </label>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-wider uppercase text-gray-400">Step 2: Destination Review Checklist Schema</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">JSON Format</span>
            </div>
            <textarea
              rows={12}
              className="w-full border border-gray-200 rounded-xl p-3 text-xs font-mono bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 shadow-inner leading-relaxed"
              value={templateConfig}
              onChange={(e) => setTemplateConfig(e.target.value)}
            />
            
            <button
              onClick={handleProcessDocument}
              disabled={processing || !file}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm shadow-md"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingesting Data & Formulating Matrix Fields...</> : <><Sparkles className="w-4 h-4" /> Execute Intelligent Check Extraction</>}
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE OUTPUT MATRIX TERMINAL DISPLAY */}
        <div className="bg-white p-5 rounded-2xl shadow border border-gray-100 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-xs font-bold tracking-wider uppercase text-gray-400">Review Matrix Results Output</h3>
            {extractedData && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractedData);
                    alert("Extracted content saved to system clipboard!");
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Copy Raw
                </button>

                {/* DOWNLOAD AS EXCEL BUTTON */}
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </button>

                {/* DOWNLOAD AS WORD BUTTON */}
                <button
                  onClick={handleExportToWord}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" /> Word
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            {extractedData ? (
              <textarea
                readOnly
                className="w-full flex-1 border border-gray-100 bg-slate-50/50 text-slate-800 font-mono text-xs rounded-xl p-4 leading-relaxed focus:outline-none shadow-inner"
                value={extractedData}
              />
            ) : (
              <div className="flex-1 border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-gray-50/40">
                <FileText className="w-12 h-12 text-gray-200 mb-2" />
                <p className="text-xs font-semibold text-gray-400">Waiting for Document Content Processing</p>
                <p className="text-[11px] text-gray-400 max-w-[340px] mt-1">
                  Upload your target file asset spreadsheet or balance document to let Gemini populate your active 19-point audit template layout.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};