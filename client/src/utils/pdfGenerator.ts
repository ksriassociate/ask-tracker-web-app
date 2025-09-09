import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date?: string;
  total_amount: number;
  paid_amount: number;
}

interface Customer {
  id: number;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone_number?: string;
  address?: string;
}

interface Task {
  id: number;
  title: string;
  billing_amount: number;
}

// ===== COMPANY LOGO BASE64 =====
const companyLogoBase64 = "data:image/jpeg;base64,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"; // your base64

const truzlyLogoBase64 = "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";

// ===== Currency formatter =====
const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(amount);

// ===== Convert number to words (Indian Rupees) =====
const numberToWords = (num: number): string => {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
  };
  return inWords(Math.floor(num)) + " Only";
};

// ===== COMMON HEADER for K Sriram & Associates =====
const addHeaderAndFooter = (doc: jsPDF, title: string = "TAX INVOICE") => {
  try { doc.addImage(companyLogoBase64, "JPEG", 15, 10, 20, 20); } catch (e) {}
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text("K Sriram & Associates", 105, 22, { align: "center" });
  doc.text("Practicing Company Secretary,", 105, 27, { align: "center" });
  doc.text("IBBI Registered Valuer (SFA),", 105, 32, { align: "center" });
  doc.text("Insolvency Professional", 105, 37, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("RV/03/2020/12934, IPA-002/IP.No.1123/2021-22/13654", 105, 42, { align: "center" });
  doc.text("No: 11, F2, Harish Homes, Dr. Ramamorrthy Nagar, Kamaraj Street,", 105, 47, { align: "center" });
  doc.text("Keelkatalai, Chennai - 600117", 105, 52, { align: "center" });
  doc.text("Email: ksriramassociates@gmail.com | Phone: +91-9444867208", 105, 57, { align: "center" });
};

// ===== INTRA-STATE (CGST+SGST) – K Sriram & Associates =====
export const generateInvoicePDF = (invoice: Invoice, customer: Customer | undefined, tasks: Task[]) => {
  const doc = new jsPDF();
  addHeaderAndFooter(doc, "TAX INVOICE");
  const invDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : new Date().toLocaleDateString();
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${invoice.invoice_number || "-"}`, 15, 70);
  doc.text(`Invoice Date: ${invDate}`, 150, 70);
  doc.setFont("helvetica", "bold"); doc.text("Bill To:", 15, 85);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.company_name || "N/A", 15, 91);
  if (customer?.address) doc.text(customer.address, 15, 97);
  if (customer?.phone_number) doc.text(`Phone: ${customer.phone_number}`, 15, 103);
  if (customer?.email) doc.text(`Email: ${customer.email}`, 15, 109);
  const taxableValue = tasks.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
  const gstRate = 0.18; const cgst = taxableValue * (gstRate / 2); const sgst = taxableValue * (gstRate / 2); const grandTotal = taxableValue + cgst + sgst;
  const tableBody = tasks.map((t, i) => [i + 1, t.title, formatCurrency(t.billing_amount || 0)]);
  tableBody.push(["", "Taxable Value", formatCurrency(taxableValue)], ["", "CGST (9%)", formatCurrency(cgst)], ["", "SGST (9%)", formatCurrency(sgst)], ["", "Grand Total", formatCurrency(grandTotal)]);
  autoTable(doc, { startY: 110, head: [["S.No", "Description", "Amount"]], body: tableBody, theme: "plain", styles: { fontSize: 10, valign: "middle" } });
  const finalY = (doc as any).lastAutoTable.finalY || 120; const paid = invoice.paid_amount || 0; const balance = grandTotal - paid;
  doc.setFont("helvetica", "bold");
  doc.text(`Net Payable (in words): ${numberToWords(grandTotal)}`, 15, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`Paid: ${formatCurrency(paid)}`, 140, finalY + 31);
  doc.text(`Balance Due: ${formatCurrency(balance)}`, 140, finalY + 37);
  doc.setFont("helvetica", "bold"); doc.text("Bank Details:", 15, finalY + 25);
  doc.setFont("helvetica", "normal");
  doc.text("Account Name: K Sriram & Associates", 15, finalY + 31);
  doc.text("Account No: 50200096530401", 15, finalY + 37);
  doc.text("IFSC Code: HDFC0000500", 15, finalY + 43);
  doc.text("Bank: HDFC Bank", 15, finalY + 49);
  doc.setFont("helvetica", "italic"); doc.text("This is a computer-generated invoice.", 105, 285, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("For K Sriram & Associates", 150, finalY + 65);
  doc.text("Proprietor: K. Sriram", 150, finalY + 71);
  doc.save(`${invoice.invoice_number || "invoice"}.pdf`);
};

// ===== INTER-STATE (IGST) – K Sriram & Associates =====
export const generateIGSTInvoicePDF = (invoice: Invoice, customer: Customer | undefined, tasks: Task[]) => {
  const doc = new jsPDF();
  addHeaderAndFooter(doc, "TAX INVOICE");
  const invDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : new Date().toLocaleDateString();
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: ${invoice.invoice_number || "-"}`, 15, 70);
  doc.text(`Invoice Date: ${invDate}`, 150, 70);
  doc.setFont("helvetica", "bold"); doc.text("Bill To:", 15, 85);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.company_name || "N/A", 15, 91);
  if (customer?.address) doc.text(customer.address, 15, 97);
  if (customer?.phone_number) doc.text(`Phone: ${customer.phone_number}`, 15, 103);
  if (customer?.email) doc.text(`Email: ${customer.email}`, 15, 109);
  const taxableValue = tasks.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
  const gstRate = 0.18; const igst = taxableValue * gstRate; const grandTotal = taxableValue + igst;
  const tableBody = tasks.map((t, i) => [i + 1, t.title, formatCurrency(t.billing_amount || 0)]);
  tableBody.push(["", "Taxable Value", formatCurrency(taxableValue)], ["", "IGST (18%)", formatCurrency(igst)], ["", "Grand Total", formatCurrency(grandTotal)]);
  autoTable(doc, { startY: 110, head: [["S.No", "Description", "Amount"]], body: tableBody, theme: "plain", styles: { fontSize: 10, valign: "middle" } });
  const finalY = (doc as any).lastAutoTable.finalY || 120; const paid = invoice.paid_amount || 0; const balance = grandTotal - paid;
  doc.setFont("helvetica", "bold");
  doc.text(`Net Payable (in words): ${numberToWords(grandTotal)}`, 15, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`Paid: ${formatCurrency(paid)}`, 140, finalY + 31);
  doc.text(`Balance Due: ${formatCurrency(balance)}`, 140, finalY + 37);
  doc.setFont("helvetica", "bold"); doc.text("Bank Details:", 15, finalY + 25);
  doc.setFont("helvetica", "normal");
  doc.text("Account Name: K Sriram & Associates", 15, finalY + 31);
  doc.text("Account No: 50200096530401", 15, finalY + 37);
  doc.text("IFSC Code: HDFC0000500", 15, finalY + 43);
  doc.text("Bank: HDFC Bank", 15, finalY + 49);
  doc.setFont("helvetica", "italic"); doc.text("This is a computer-generated invoice.", 105, 285, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("For K Sriram & Associates", 150, finalY + 65);
  doc.text("Proprietor: K. Sriram", 150, finalY + 71);
  doc.save(`${invoice.invoice_number || "invoice"}-igst.pdf`);
};

// ===== INTRA-STATE (CGST+SGST) – SECOND COMPANY (TRUZLY INDIA) =====
export const generateInvoicePDF_Alt = (invoice: Invoice, customer: Customer | undefined, tasks: Task[]) => {
  const doc = new jsPDF();
  // Header for TRUZLY INDIA (replace details accordingly)
  try { doc.addImage(truzlyLogoBase64, "JPEG", 15, 10, 20, 20); } catch (e) {}
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("TAX INVOICE", 105, 15, { align: "center" });
  doc.setFontSize(10); doc.text("TRUZLY INDIA (OPC) PVT. LTD", 105, 22, { align: "center" });
  doc.text("GST No: 33AAICT2891D1ZD", 105, 27, { align: "center" });
  doc.text("No.11, F2, Dr. Ramamoorthy Nagar, Kamaraj Street", 105, 32, { align: "center" });
  doc.text("Keelkattalai, Chennai - 600 117.", 105, 37, { align: "center" });
  // body same as generateInvoicePDF:
  const invDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : new Date().toLocaleDateString();
  doc.setFont("helvetica", "normal"); doc.text(`Invoice No: ${invoice.invoice_number || "-"}`, 15, 70); doc.text(`Invoice Date: ${invDate}`, 150, 70);
  doc.setFont("helvetica", "bold"); doc.text("Bill To:", 15, 85);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.company_name || "N/A", 15, 91);
  if (customer?.address) doc.text(customer.address, 15, 97);
  if (customer?.phone_number) doc.text(`Phone: ${customer.phone_number}`, 15, 103);
  if (customer?.email) doc.text(`Email: ${customer.email}`, 15, 109);
  const taxableValue = tasks.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
  const gstRate = 0.18; const cgst = taxableValue * (gstRate / 2); const sgst = taxableValue * (gstRate / 2); const grandTotal = taxableValue + cgst + sgst;
  const tableBody = tasks.map((t, i) => [i + 1, t.title, formatCurrency(t.billing_amount || 0)]);
  tableBody.push(["", "Taxable Value", formatCurrency(taxableValue)], ["", "CGST (9%)", formatCurrency(cgst)], ["", "SGST (9%)", formatCurrency(sgst)], ["", "Grand Total", formatCurrency(grandTotal)]);
  autoTable(doc, { startY: 110, head: [["S.No", "Description", "Amount"]], body: tableBody, theme: "plain", styles: { fontSize: 10, valign: "middle" } });
  const finalY = (doc as any).lastAutoTable.finalY || 120; const paid = invoice.paid_amount || 0; const balance = grandTotal - paid;
  doc.setFont("helvetica", "bold");
  doc.text(`Net Payable (in words): ${numberToWords(grandTotal)}`, 15, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`Paid: ${formatCurrency(paid)}`, 140, finalY + 31);
  doc.text(`Balance Due: ${formatCurrency(balance)}`, 140, finalY + 37);
  doc.setFont("helvetica", "bold"); doc.text("Bank Details:", 15, finalY + 25);
  doc.setFont("helvetica", "normal");
  doc.text("Account Name: Truzly India (OPC) Pvt. Ltd", 15, finalY + 31);
  doc.text("Account No: 5845056748", 15, finalY + 37);
  doc.text("IFSC Code: KKBK0008493", 15, finalY + 43);
  doc.text("Branch: Guindy Madras Race Club, Chennai", 15, finalY + 49);
  doc.setFont("helvetica", "italic"); doc.text("This is a computer-generated invoice.", 105, 285, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.text("For Truzly India (OPC) Pvt. Ltd", 150, finalY + 65);
  doc.text("Authorised Signatory", 150, finalY + 71);
  doc.save(`${invoice.invoice_number || "invoice"}-truzly.pdf`);
};

// ===== INTER-STATE (IGST) – SECOND COMPANY (TRUZLY INDIA) =====
export const generateIGSTInvoicePDF_Alt = (invoice: Invoice, customer: Customer | undefined, tasks: Task[]) => {
  const doc = new jsPDF();
  try { doc.addImage(truzlyLogoBase64, "JPEG", 15, 10, 20, 20); } catch (e) {}
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("TAX INVOICE", 105, 15, { align: "center" });
  doc.setFontSize(10); doc.text("Truzly India (OPC) Pvt. Ltd", 105, 22, { align: "center" });
  doc.text("GST No: 33AAICT2891D1ZD", 105, 27, { align: "center" });
  doc.text("No.11, F2, Dr. Ramamoorthy Nagar, Kamaraj Street", 105, 32, { align: "center" });
  doc.text("Keelkattalai, Chennai - 600 117. ", 105, 37, { align: "center" });
  const invDate = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : new Date().toLocaleDateString();
  doc.setFont("helvetica", "normal"); doc.text(`Invoice No: ${invoice.invoice_number || "-"}`, 15, 70); doc.text(`Invoice Date: ${invDate}`, 150, 70);
  doc.setFont("helvetica", "bold"); doc.text("Bill To:", 15, 85);
  doc.setFont("helvetica", "normal");
  doc.text(customer?.company_name || "N/A", 15, 91);
  if (customer?.address) doc.text(customer.address, 15, 97);
  if (customer?.phone_number) doc.text(`Phone: ${customer.phone_number}`, 15, 103);
  if (customer?.email) doc.text(`Email: ${customer.email}`, 15, 109);
  const taxableValue = tasks.reduce((sum, t) => sum + (t.billing_amount || 0), 0);
  const gstRate = 0.18; const igst = taxableValue * gstRate; const grandTotal = taxableValue + igst;
  const tableBody = tasks.map((t, i) => [i + 1, t.title, formatCurrency(t.billing_amount || 0)]);
  tableBody.push(["", "Taxable Value", formatCurrency(taxableValue)], ["", "IGST (18%)", formatCurrency(igst)], ["", "Grand Total", formatCurrency(grandTotal)]);
  autoTable(doc, { startY: 110, head: [["S.No", "Description", "Amount"]], body: tableBody, theme: "plain", styles: { fontSize: 10, valign: "middle" } });
  const finalY = (doc as any).lastAutoTable.finalY || 120; const paid = invoice.paid_amount || 0; const balance = grandTotal - paid;
  doc.setFont("helvetica", "bold");
  doc.text(`Net Payable (in words): ${numberToWords(grandTotal)}`, 15, finalY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`Paid: ${formatCurrency(paid)}`, 140, finalY + 31);
  doc.text(`Balance Due: ${formatCurrency(balance)}`, 140, finalY + 37);
  doc.setFont("helvetica", "bold"); doc.text("Bank Details:", 15, finalY + 25);
  doc.setFont("helvetica", "normal");
  doc.text("Account Name: Truzly India (OPC) Pvt. Ltd", 15, finalY + 31);
  doc.text("Account No: 5845056748", 15, finalY + 37);
  doc.text("IFSC Code: KKBK0008493", 15, finalY + 43);
  doc.text("Branch: Guindy Madras Race Club, Chennai", 15, finalY + 49);
  doc.setFont("helvetica", "italic"); doc.text("This is a computer-generated invoice.", 105, 285, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.text("For TRUZLY INDIA (OPC) PVT. LTD", 150, finalY + 65);
  doc.text("Authorised Signatory", 150, finalY + 71);
  doc.save(`${invoice.invoice_number || "invoice"}-truzly-igst.pdf`);
};
