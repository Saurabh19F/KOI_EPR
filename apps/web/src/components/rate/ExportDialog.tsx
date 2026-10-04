'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rateApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  analysisId: string;
  analysisNo: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d?: string | Date): string {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── HTML template builder ────────────────────────────────────────────────────
// Builds a complete HTML document string that looks exactly like the reference PDF.
// We render this into a hidden <iframe>, capture with html2canvas, and embed into jsPDF.
function buildHtmlTemplate(analysis: any, analysisNo: string): string {
  const items: any[] = analysis?.items ?? analysis?.analysisItems ?? [];
  const totalCbm = items.reduce((s: number, it: any) => s + Number(it.totalCbm ?? 0), 0);

  const buyerName  = analysis?.customerName  ?? '';
  const buyerCode  = analysis?.buyerCode     ?? '';
  const country    = analysis?.countryName   ?? analysis?.country ?? '';
  const payTerms   = analysis?.paymentTermsName ?? analysis?.paymentTerms ?? 'FOB';
  const currency   = analysis?.currencyName  ?? analysis?.currencyId ?? 'USD';
  const pol        = analysis?.portOfLoading ?? '';
  const pod        = analysis?.pod           ?? '';

  const tableRows = items.map((it: any, i: number) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f2f5f9'}">
      <td style="text-align:center;border:0.5px solid #ccc;padding:5px 4px;font-size:7.5pt">${i + 1}</td>
      <td style="border:0.5px solid #ccc;padding:5px 6px;font-size:7.5pt">${it.productName ?? '-'}</td>
      <td style="text-align:center;border:0.5px solid #ccc;padding:5px 4px;font-size:7.5pt">${it.unitSize ?? '-'}</td>
      <td style="text-align:center;border:0.5px solid #ccc;padding:5px 4px;font-size:7.5pt">${it.unitsPerCase ?? 0}</td>
      <td style="text-align:right;border:0.5px solid #ccc;padding:5px 6px;font-size:7.5pt">${Number(it.finalSellingRate ?? 0).toFixed(2)}</td>
      <td style="text-align:right;border:0.5px solid #ccc;padding:5px 6px;font-size:7.5pt">${it.orderQuantity ?? ''}</td>
      <td style="text-align:right;border:0.5px solid #ccc;padding:5px 6px;font-size:7.5pt">${Number(it.totalCbm ?? 0).toFixed(3)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 8.5pt; color: #000; background: #fff; width: 794px; padding: 15px; }
  table { border-collapse: collapse; }

  /* ── HEADER ── */
  .header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 12px; }
  .logo-area { width: 230px; }
  .logo-area img { width: 210px; height: auto; display: block; }
  .sales-enq-box { width: 260px; }
  .sales-enq-title {
    background: #FF9900; color: #fff; font-size: 16pt; font-weight: bold;
    text-align: center; padding: 6px 10px; line-height: 1.1;
  }
  .sales-enq-row {
    display: flex; border: 0.5px solid #ccc; border-top: none;
    font-size: 9.5pt; padding: 6px 8px; line-height: 1.3;
  }
  .sales-enq-row .lbl { width: 90px; color: #333; }
  .sales-enq-row .val { font-weight: bold; color: #000; }

  /* ── SALES PERSON BAR ── */
  .sales-person-bar {
    background: #00B0BE; color: #fff; font-weight: bold; font-size: 9pt;
    padding: 6px 10px; margin-bottom: 0;
  }

  /* ── INFO SECTION ── */
  .info-section { display: flex; border: 0.5px solid #ccc; border-top: none; margin-bottom: 10px; }
  .info-left { width: 280px; border-right: 0.5px solid #ccc; }
  .info-left .info-row {
    display: flex; align-items: center; border-bottom: 0.5px solid #ccc;
    min-height: 28px; padding: 4px 8px; font-size: 8.5pt;
  }
  .info-left .info-row:last-child { border-bottom: none; }
  .info-left .info-row .lbl { width: 60px; font-weight: bold; color: #333; }
  .info-left .info-row .val { flex: 1; color: #000; }
  
  .info-right { flex: 1; display: flex; flex-direction: column; }
  .terms-header {
    background: #FFD700; font-weight: bold; font-size: 9pt; text-align: center;
    padding: 6px; border-bottom: 0.5px solid #ccc; color: #000;
  }
  .terms-cols { display: flex; flex: 1; }
  .payment-col { flex: 1; border-right: 0.5px solid #ccc; display: flex; flex-direction: column; }
  .delivery-col { flex: 1; display: flex; flex-direction: column; }
  .terms-subhdr {
    background: #FFA500; color: #fff; font-weight: bold; font-size: 8.5pt;
    padding: 4px 8px; border-bottom: 0.5px solid #ccc;
  }
  .terms-body { padding: 6px 8px; font-size: 8pt; line-height: 1.5; color: #333; flex: 1; }

  /* ── VALIDITY ── */
  .validity {
    font-size: 7.5pt; color: #C00000;
    font-style: italic; border-top: 0.5px solid #ccc; border-bottom: 0.5px solid #ccc;
    padding: 4px 6px; margin-bottom: 10px;
  }

  /* ── BUYER / OTHER DETAILS ── */
  .buyer-section { display: flex; margin-bottom: 10px; }
  .buyer-hdr {
    background: #00B0BE; color: #fff; font-weight: bold; font-size: 9pt;
    padding: 5px 8px;
  }
  .other-hdr {
    background: #FFD700; color: #000; font-weight: bold; font-size: 9pt;
    padding: 5px 8px;
  }
  .buyer-col { width: 50%; border: 0.5px solid #ccc; }
  .other-col { width: 50%; border: 0.5px solid #ccc; border-left: none; }
  .buyer-body { padding: 6px 8px; font-size: 8pt; line-height: 1.6; }
  .buyer-body .row { display: flex; margin-bottom: 2px; }
  .buyer-body .lbl { font-weight: bold; width: 110px; color: #333; }
  .buyer-body .val { flex: 1; color: #000; }
  .other-body { padding: 6px 8px; font-size: 8pt; line-height: 1.6; }
  .other-body .row { display: flex; margin-bottom: 2px; }
  .other-body .lbl { font-weight: bold; width: 120px; color: #333; }
  .other-body .val { flex: 1; color: #000; }

  /* ── BLUE SEPARATOR ── */
  .blue-sep { background: #0070C0; height: 6px; margin-bottom: 10px; }

  /* ── PRODUCT TABLE ── */
  .table-wrap { margin-bottom: 8px; }
  .product-table { width: 100%; border-collapse: collapse; }
  .product-table th {
    background: #1F4E79; color: #fff; font-weight: bold; font-size: 8.5pt;
    text-align: center; border: 0.5px solid #1F4E79; padding: 6px 4px;
    vertical-align: middle;
  }
  .product-table th.left { text-align: left; padding-left: 8px; }
  .product-table td { border: 0.5px solid #ccc; padding: 4px 6px; font-size: 8pt; }

  /* ── TOTAL CBM ── */
  .total-cbm-row {
    text-align: right; padding: 6px 8px; font-weight: bold; font-size: 9.5pt;
    border-top: 1px solid #aaa; margin-bottom: 15px;
  }
  .total-cbm-row span { margin-left: 20px; color: #1F4E79; }

  /* ── FOOTER ── */
  .footer { display: flex; gap: 10px; }
  .bank-col { flex: 0 0 65%; border: 0.5px solid #ccc; }
  .bank-hdr {
    background: #0070C0; color: #fff; font-weight: bold; font-size: 8.5pt;
    padding: 5px 8px;
  }
  .bank-body { padding: 8px; font-size: 7.5pt; line-height: 1.6; color: #333; }
  .sig-col { flex: 1; border: 0.5px solid #ccc; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 8px; background: #fafafa; }
  .sig-top { font-size: 8pt; font-weight: bold; color: #333; margin-bottom: auto; }
  .sig-line { width: 90%; border-top: 0.5px solid #aaa; margin-top: auto; margin-bottom: 4px; }
  .sig-btm { font-size: 7.5pt; color: #555; font-weight: bold; }
</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<div class="header">
  <div class="logo-area">
    <img src="/koi-logo-rectangle.png" alt="KOI Logo"/>
  </div>
  <div class="sales-enq-box">
    <div class="sales-enq-title">Sales Enquiry</div>
    <div class="sales-enq-row">
      <div class="lbl">Quotation</div>
      <div class="val">${analysisNo}</div>
    </div>
    <div class="sales-enq-row">
      <div class="lbl">Date</div>
      <div class="val">${fmtDate(analysis?.analysisDate)}</div>
    </div>
  </div>
</div>

<!-- ═══ SALES PERSON BAR ═══ -->
<div class="sales-person-bar">SALES PERSON</div>

<!-- ═══ 3-COLUMN INFO SECTION ═══ -->
<div class="info-section">
  <!-- Left: Name / Email / Phone -->
  <div class="info-left">
    <div class="info-row"><span class="lbl">Name :</span><span class="val">Admin User</span></div>
    <div class="info-row"><span class="lbl">Email :</span><span class="val">admin@kolindia.com</span></div>
    <div class="info-row"><span class="lbl">Phone :</span><span class="val">+91 9999999999</span></div>
  </div>
  <!-- Right: Terms of Delivery and Payment -->
  <div class="info-right">
    <div class="terms-header">Terms of Delivery and Payment</div>
    <div class="terms-cols">
      <div class="payment-col">
        <div class="terms-subhdr">Payment terms :-</div>
        <div class="terms-body">
          1) Advance payment 30%<br/>
          2) Final and Full payment on BL<br/>
          3) Other
        </div>
      </div>
      <div class="delivery-col">
        <div class="terms-subhdr">Delivery Terms:-</div>
        <div class="terms-body">
          1) Delivery will be confirmed after<br/>
          &nbsp;&nbsp;&nbsp;the date of order confirmation.<br/>
          2) After receiving of advance<br/>
          &nbsp;&nbsp;&nbsp;payment, procurement will be
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ VALIDITY NOTICE ═══ -->
<div class="validity">
  Validity:- This Proforma Invoice is valid for a period of 10 days from the date of issue. Prices and terms are subject to change after this validity period without prior notice.
</div>

<!-- ═══ BUYER / OTHER DETAILS ═══ -->
<div class="buyer-section">
  <div class="buyer-col">
    <div class="buyer-hdr">Buyer Details:</div>
    <div class="buyer-body">
      <div class="row"><span class="lbl">Company Name :</span><span class="val"><strong>${buyerName}</strong></span></div>
      <div class="row"><span class="lbl">Address:</span><span class="val">${country}</span></div>
      <div class="row"><span class="lbl">Phone :</span><span class="val">-</span></div>
      <div class="row"><span class="lbl">Email :</span><span class="val">-</span></div>
    </div>
  </div>
  <div class="other-col">
    <div class="other-hdr">Other Details</div>
    <div class="other-body">
      <div class="row"><span class="lbl">Payment Terms :</span><span class="val">${payTerms}</span></div>
      <div class="row"><span class="lbl">Currency :</span><span class="val">${currency}</span></div>
      <div class="row"><span class="lbl">Port of Loading :</span><span class="val">${pol}</span></div>
      <div class="row"><span class="lbl">POD :</span><span class="val">${pod}</span></div>
      <div class="row"><span class="lbl">Buyer Code :</span><span class="val">${buyerCode}</span></div>
    </div>
  </div>
</div>

<!-- ═══ BLUE SEPARATOR ═══ -->
<div class="blue-sep"></div>

<!-- ═══ PRODUCT TABLE ═══ -->
<div class="table-wrap">
  <table class="product-table">
    <thead>
      <tr>
        <th style="width:50px">S. NO.</th>
        <th class="left">Product Name</th>
        <th style="width:85px">Unit Size</th>
        <th style="width:78px">Units Per Case</th>
        <th style="width:88px">Final Selling Rate</th>
        <th style="width:98px">Order Quantity</th>
        <th style="width:78px">Total CBM</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</div>

<!-- ═══ TOTAL CBM ═══ -->
<div class="total-cbm-row">
  Total CBM: <span>${totalCbm.toFixed(3)}</span>
</div>

<!-- ═══ FOOTER ═══ -->
<div class="footer">
  <div class="bank-col">
    <div class="bank-hdr">Company Bank Details:</div>
    <div class="bank-body">
      <strong>Account Holder: KRISHNA OVERSEAS INC.</strong><br/>
      Bank: Standard Chartered Bank<br/>
      A/C No : 5 2 9 0 5 0 9 7 5 4 4<br/>
      Swift Code : S C B L I N B B D E L<br/>
      Branch Address : 13/37 WEA Arya Samaj Rd. Karol Bagh New Delhi - 05 (India)
    </div>
  </div>
  <div class="sig-col">
    <div class="sig-top">Signature and Seal</div>
    <div class="sig-line"></div>
    <div class="sig-btm">Authorised signatory</div>
  </div>
</div>

</body>
</html>`;
}

// ─── Main PDF generator ───────────────────────────────────────────────────────
async function generatePDF(analysis: any, analysisNo: string) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // Build HTML content
  const html = buildHtmlTemplate(analysis, analysisNo);

  // Create a hidden iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:auto;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for images to load
  await new Promise(resolve => setTimeout(resolve, 800));

  const iframeBody = iframeDoc.body;
  iframeBody.style.margin = '0';
  iframeBody.style.padding = '0';

  // A4 at 96 DPI = 794 x 1123 px
  const A4_W_PX = 794;
  const A4_H_PX = 1123;
  const scale = 2; // 2x for crisp output

  // Capture the full body in chunks (one page at a time)
  const totalHeight = Math.max(iframeBody.scrollHeight, iframeBody.offsetHeight);
  const numPages = Math.ceil(totalHeight / A4_H_PX);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_W_MM = doc.internal.pageSize.getWidth();
  const PAGE_H_MM = doc.internal.pageSize.getHeight();

  for (let page = 0; page < numPages; page++) {
    const scrollY = page * A4_H_PX;

    // Capture this page's slice
    const canvas = await html2canvas(iframeBody, {
      scale,
      useCORS: true,
      allowTaint: true,
      scrollY: -scrollY,
      width: A4_W_PX,
      height: A4_H_PX,
      windowWidth: A4_W_PX,
      windowHeight: A4_H_PX,
      backgroundColor: '#ffffff',
      y: scrollY,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (page > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, PAGE_W_MM, PAGE_H_MM);
  }

  document.body.removeChild(iframe);
  doc.save(`${analysisNo}-Sales-Enquiry.pdf`);
}

// ─── React Component ──────────────────────────────────────────────────────────
export function ExportDialog({ open, onClose, analysisId, analysisNo }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exported,    setExported   ] = useState(false);

  const { data: analysisRes } = useQuery({
    queryKey: ['rate-analysis', analysisId],
    queryFn:  () => rateApi.getAnalysisById(analysisId),
    enabled:  open,
  });

  const analysis = analysisRes?.data;

  const handleExport = async () => {
    if (!analysis) {
      toast.error('Analysis data not loaded yet — please wait and try again.');
      return;
    }
    setIsExporting(true);
    try {
      await generatePDF(analysis, analysisNo);
      toast.success('PDF exported!');
      setExported(true);
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error('Export failed: ' + (err?.message ?? String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => { setExported(false); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Export Sales Enquiry PDF
          </DialogTitle>
          <DialogDescription>
            Exports <strong>{analysisNo}</strong> as a KOI Sales Enquiry PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-xs text-orange-800 space-y-1">
          <p className="font-semibold">Includes:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-orange-700">
            <li>KOI logo · Sales Enquiry · Quotation &amp; Date</li>
            <li>Sales Person · Payment &amp; Delivery Terms</li>
            <li>Buyer Details · Other Details</li>
            <li>Product table · Total CBM</li>
            <li>Bank Details · Authorised Signatory</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
          {exported ? (
            <Button size="sm" onClick={handleClose} className="bg-green-600 hover:bg-green-700 text-white">✓ Done</Button>
          ) : (
            <Button
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {isExporting
                ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Generating…</>
                : <><Download className="h-4 w-4 mr-1.5" />Export PDF</>
              }
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
