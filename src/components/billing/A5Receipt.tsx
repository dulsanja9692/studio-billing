"use client";
import React from "react";
import { Printer, Phone, Calendar, User, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface A5ReceiptProps {
  billNo: string;
  date?: string;
  customerName: string;
  customerPhone?: string;
  items?: Array<{ name: string; price: number }>;
  subtotal?: number;
  discount?: {
    name: string;
    amount: number;
    type?: string;
    value?: number;
  } | null;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStep?: number;
  totalSteps?: number;
  onPrint?: () => void;
  onClose?: () => void;
}

export default function A5Receipt({
  billNo,
  date,
  customerName,
  customerPhone,
  items = [],
  subtotal,
  discount,
  totalAmount,
  paidAmount,
  balanceDue,
  paymentStep = 1,
  totalSteps = 1,
  onPrint,
  onClose,
}: A5ReceiptProps) {
  const displayDate = date || new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const effectiveSubtotal = subtotal !== undefined && subtotal > totalAmount ? subtotal : totalAmount + (discount?.amount || 0);
  const isFullyPaid = balanceDue <= 0;
  const cleanPhone = customerPhone && customerPhone.trim() ? customerPhone.trim() : "N/A";

  // Build standalone A4 HTML template for printing
  const generateA4Html = () => {
    const itemsRows = items && items.length > 0 ? items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; font-family: monospace; color: #64748b; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-weight: 600; color: #0f172a; font-size: 14px;">${item.name}</td>
        <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 14px;">
          Rs. ${Number(item.price).toLocaleString()}
        </td>
      </tr>
    `).join("") : `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-family: monospace; color: #64748b;">1</td>
        <td style="padding: 12px; font-weight: 600; color: #0f172a;">Studio Photography / Videography Services</td>
        <td style="padding: 12px; text-align: right; font-family: monospace; font-weight: 700;">
          Rs. ${Number(totalAmount).toLocaleString()}
        </td>
      </tr>
    `;

    const discountRow = discount && discount.amount > 0 ? `
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 6px;">
        <span>Subtotal:</span>
        <span style="font-family: monospace;">Rs. ${Number(effectiveSubtotal).toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: #047857; font-weight: 700; margin-bottom: 6px;">
        <span>Discount (${discount.name}):</span>
        <span style="font-family: monospace;">- Rs. ${Number(discount.amount).toLocaleString()}</span>
      </div>
    ` : "";

    const statusBadge = isFullyPaid ? `
      <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase;">
        ✓ Full Payment Completed
      </span>
    ` : `
      <span style="display: inline-block; background-color: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase;">
        Step ${paymentStep} (Balance Due)
      </span>
    `;

    const installmentNotice = isFullyPaid ? `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 10px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 700; margin-bottom: 24px;">
        ✓ FULL PAYMENT COMPLETED — NO OUTSTANDING BALANCE DUE
      </div>
    ` : `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 10px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 700; margin-bottom: 24px;">
        STEP ${paymentStep} ADVANCE RECORDED • REMAINING BALANCE PAYABLE: Rs. ${Number(balanceDue).toLocaleString()}
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Godage Studio - Invoice ${billNo || "Receipt"}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 100%;
              background: #ffffff;
              color: #0f172a;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-box {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <!-- HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <img src="/logo.jpg" alt="Godage Studio" style="width: 64px; height: 64px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px;" />
                <div>
                  <h1 style="font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin: 0; color: #0f172a; line-height: 1;">
                    GODAGE STUDIO
                  </h1>
                  <p style="font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px;">
                    Professional Photography &amp; Videography
                  </p>
                  <p style="font-size: 12px; color: #64748b; margin-top: 2px;">
                    Weddings • Portraits • Events • Commercial
                  </p>
                </div>
              </div>

              <div style="text-align: right;">
                <div style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; padding: 6px 14px; border-radius: 4px;">
                  STUDIO INVOICE
                </div>
                <div style="margin-top: 8px; font-size: 13px; color: #334155;">
                  <p style="font-weight: 700;">📞 / 💬 <span style="font-family: monospace; font-size: 14px; color: #0f172a;">0715926263</span></p>
                  <p style="font-size: 12px; color: #64748b; margin-top: 2px;">Official Studio Bill &amp; Receipt</p>
                </div>
              </div>
            </div>

            <!-- CUSTOMER & INVOICE META GRID -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <div style="border-right: 1px solid #e2e8f0; padding-right: 16px;">
                <p style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">
                  BILLED TO
                </p>
                <p style="font-size: 17px; font-weight: 900; color: #0f172a; margin-bottom: 6px;">
                  ${customerName || "Valued Customer"}
                </p>
                <p style="font-size: 14px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                  <span>📞 Phone:</span>
                  <span style="font-family: monospace; color: #1d4ed8; font-size: 15px;">${cleanPhone}</span>
                </p>
              </div>

              <div style="padding-left: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Bill Ref #:</span>
                  <span style="font-family: monospace; font-size: 14px; font-weight: 900; color: #0f172a; background: #ffffff; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px;">
                    ${billNo || "#GS-0000"}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #475569; margin-bottom: 8px;">
                  <span>Invoice Date:</span>
                  <span style="font-weight: 700; color: #0f172a;">${displayDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 13px; color: #475569;">Payment Status:</span>
                  ${statusBadge}
                </div>
              </div>
            </div>

            <!-- ITEMIZED TABLE -->
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background-color: #0f172a; color: #ffffff; font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                    <th style="padding: 10px 12px; width: 48px;">#</th>
                    <th style="padding: 10px 12px;">Service / Item Description</th>
                    <th style="padding: 10px 12px; text-align: right; width: 160px;">Price (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </div>

            <!-- FINANCIAL TOTALS -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
              <div style="width: 320px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                ${discountRow}
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-bottom: 6px;">
                  <span>Total Amount:</span>
                  <span style="font-family: monospace;">Rs. ${Number(totalAmount).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #047857; margin-bottom: 8px;">
                  <span>Paid Amount:</span>
                  <span style="font-family: monospace;">Rs. ${Number(paidAmount).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; border-top: 1px dashed #cbd5e1; padding-top: 8px; color: ${balanceDue > 0 ? "#b91c1c" : "#047857"};">
                  <span>${balanceDue > 0 ? "Balance Due:" : "Balance Settled:"}</span>
                  <span style="font-family: monospace;">Rs. ${Number(balanceDue).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <!-- INSTALLMENT BANNER -->
            ${installmentNotice}

            <!-- TERMS & OFFICIAL STAMP -->
            <div style="border-top: 2px solid #e2e8f0; padding-top: 18px; margin-top: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
                <div style="max-w: 360px; font-size: 12px; color: #64748b; line-height: 1.6;">
                  <p style="font-weight: 800; color: #334155; text-transform: uppercase; font-size: 11px; margin-bottom: 4px;">Collection Notice:</p>
                  <p>• Please present this official invoice reference for album and photo collections.</p>
                  <p>• For inquiries, reschedules, or album updates, call our hotline anytime.</p>
                </div>

                <div style="text-align: center; width: 220px;">
                  <div style="border-bottom: 1px solid #475569; height: 42px; margin-bottom: 6px;"></div>
                  <p style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                    Authorized Studio Stamp &amp; Seal
                  </p>
                </div>
              </div>

              <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                Godage Studio • Hotline / WhatsApp: 0715926263 • Thank you for choosing Godage Studio!
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    const htmlContent = generateA4Html();

    // 1. First attempt: Direct print window (cleanest, 100% full A4 paper scaling)
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 350);
      return;
    }

    // 2. Fallback: Isolated hidden iframe
    let iframe = document.getElementById("a4-print-frame") as HTMLIFrameElement | null;
    if (iframe) iframe.remove();

    iframe = document.createElement("iframe");
    iframe.id = "a4-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
        setTimeout(() => iframe?.remove(), 3000);
      }, 350);
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* On-screen Invoice Preview Card (Formatted cleanly for A4 proportion) */}
      <div 
        id="printable-receipt"
        className="w-full bg-white text-slate-900 border border-slate-200 shadow-md rounded-xl p-6 sm:p-8 font-sans print:p-0 print:border-none print:shadow-none print:rounded-none"
      >
        {/* HEADER */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-white p-1">
                <img 
                  src="/logo.jpg" 
                  alt="Godage Studio" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-wider text-slate-900 leading-none uppercase">
                  Godage Studio
                </h1>
                <p className="text-xs font-bold text-slate-600 tracking-wide uppercase mt-1">
                  Professional Photography &amp; Videography
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Weddings • Portraits • Events • Commercial
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded">
                Studio Invoice
              </span>
              <div className="mt-1.5 text-xs text-slate-700 font-semibold space-y-0.5">
                <p className="flex items-center justify-end gap-1">
                  <span>📞 / 💬</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">0715926263</span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Official Bill &amp; Receipt</p>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER & INVOICE DETAILS GRID */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="space-y-1.5 border-r border-slate-200 pr-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="h-3 w-3" /> Billed To
            </p>
            <p className="text-base font-black text-slate-900 leading-tight truncate">
              {customerName || "Valued Customer"}
            </p>
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs pt-0.5">
              <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Phone:</span>
              <span className="font-mono font-bold text-blue-700">
                {cleanPhone}
              </span>
            </div>
          </div>

          <div className="space-y-2 pl-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bill Ref #:</span>
              <span className="font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                {billNo || "#GS-0000"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date:</span>
              <span className="font-bold text-slate-900">{displayDate}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Status:</span>
              {isFullyPaid ? (
                <span className="text-emerald-700 font-black text-[11px] uppercase bg-emerald-100/90 px-2 py-0.5 rounded">
                  ✓ Paid Full
                </span>
              ) : (
                <span className="text-orange-700 font-black text-[11px] uppercase bg-orange-100/90 px-2 py-0.5 rounded">
                  Step {paymentStep} (Balance Due)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ITEMIZED TABLE */}
        <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-left w-10">#</th>
                <th className="py-2.5 px-3 text-left">Service / Item Description</th>
                <th className="py-2.5 px-3 text-right w-32">Price (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-900 text-xs">{item.name}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                      Rs. {Number(item.price).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">1</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 text-xs">Photography / Studio Services</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                    Rs. {Number(totalAmount).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="flex justify-end mb-4">
          <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            {discount && discount.amount > 0 && (
              <>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Subtotal:</span>
                  <span className="font-mono">Rs. {Number(effectiveSubtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                  <span>Discount ({discount.name}):</span>
                  <span className="font-mono">- Rs. {Number(discount.amount).toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-200 pt-1.5">
              <span>Total Amount:</span>
              <span className="font-mono">Rs. {Number(totalAmount).toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-bold text-xs">
              <span>Paid Amount:</span>
              <span className="font-mono">Rs. {Number(paidAmount).toLocaleString()}</span>
            </div>

            <div className="flex justify-between font-black text-xs pt-1.5 border-t border-dashed border-slate-300">
              <span className={balanceDue > 0 ? "text-red-700" : "text-emerald-700"}>
                {balanceDue > 0 ? "Balance Due:" : "Balance Settled:"}
              </span>
              <span className={`font-mono text-sm ${balanceDue > 0 ? "text-red-700" : "text-emerald-700"}`}>
                Rs. {Number(balanceDue).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* INSTALLMENT PROGRESS NOTICE */}
        <div className="mb-4 p-2 rounded-lg text-center text-xs font-bold border">
          {isFullyPaid ? (
            <div className="text-emerald-800 bg-emerald-50 border-emerald-200 py-1 rounded">
              ✓ FULL PAYMENT COMPLETED — NO BALANCE DUE
            </div>
          ) : (
            <div className="text-blue-900 bg-blue-50 border-blue-200 py-1 rounded">
              STEP {paymentStep} ADVANCE RECORDED • REMAINING BALANCE: Rs. {Number(balanceDue).toLocaleString()}
            </div>
          )}
        </div>

        {/* TERMS & SEAL (NO CUSTOMER SIGNATURE) */}
        <div className="border-t border-slate-200 pt-4 mt-2">
          <div className="flex justify-between items-end text-xs text-slate-600 mb-2">
            <div className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
              <p className="font-bold text-slate-700 uppercase tracking-tight text-[10px] mb-1">Collection Notice:</p>
              <p>• Please present this official bill reference for album &amp; photo collections.</p>
              <p>• Inquiries &amp; appointments: 0715926263.</p>
            </div>
            
            <div className="text-center w-52">
              <div className="border-b border-slate-400 mb-1.5 h-10"></div>
              <p className="font-bold uppercase text-[9px] text-slate-600 tracking-wider">
                Authorized Studio Stamp &amp; Seal
              </p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
            Godage Studio • Hotline / WhatsApp: 0715926263 • Thank you for your business!
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-3 w-full mt-4 no-print">
        <Button 
          onClick={handlePrint}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Invoice (A4)
        </Button>
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-11 px-6 text-sm font-semibold text-slate-700"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
