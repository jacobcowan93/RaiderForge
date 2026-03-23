// blueprintReportUtils.js — PDF and JPEG export for missing blueprints report.
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Capture report element as JPEG and trigger download.
 */
export async function downloadReportAsImage(element, filename = "missing-blueprints-report.jpg") {
  if (!element) throw new Error("Report element not found");
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0d0d0d",
    logging: false,
  });
  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Capture report element and embed in PDF, then trigger download.
 */
export async function downloadReportAsPdf(element, filename = "missing-blueprints-report.pdf") {
  if (!element) throw new Error("Report element not found");
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0d0d0d",
    logging: false,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxW = pdfW - margin * 2;
  const maxH = pdfH - margin * 2;
  const aspect = canvas.width / canvas.height;
  const w = aspect > maxW / maxH ? maxW : maxH * aspect;
  const h = aspect > maxW / maxH ? maxW / aspect : maxH;
  pdf.addImage(imgData, "JPEG", margin, margin, w, h);
  pdf.save(filename);
}
