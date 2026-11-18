"use client";
import React from "react";
import Image from "next/image";
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

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* On-screen A5 Page Container */}
      <div 
        id="printable-receipt"
        className="w-full bg-white text-slate-900 border border-slate-200 shadow-lg rounded-sm print:border-none print:shadow-none font-sans"
        style={{
          width: "100%",
          maxWidth: "520px", // A5 aspect on screen
          padding: "20px 24px",
          boxSizing: "border-box",
        }}
      >
        {/* ========================================================
            1. HEADER: BRANDING & CONTACT INFO
            ======================================================== */}
        <div className="border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Logo & Studio Name */}
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0 rounded border border-slate-200 overflow-hidden bg-white p-0.5">
                <img 
                  src="/logo.jpg" 
                  alt="Godage Studio" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wider text-slate-900 leading-none uppercase">
                  Godage Studio
                </h1>
                <p className="text-[11px] font-bold text-slate-600 tracking-wide uppercase mt-1">
                  Professional Photography &amp; Videography
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Weddings • Portraits • Events • Commercial
                </p>
              </div>
            </div>

            {/* Document Title & Contact */}
            <div className="text-right shrink-0">
              <span className="inline-block bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-sm">
                Studio Invoice
              </span>
              <div className="mt-1 text-[11px] text-slate-700 font-semibold space-y-0.5">
                <p className="flex items-center justify-end gap-1">
                  <span>📞 / 💬</span>
                  <span className="font-mono font-bold text-slate-900">0715926263</span>
                </p>
                <p className="text-[10px] text-slate-500">Official Bill &amp; Receipt</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. CUSTOMER & INVOICE DETAILS GRID
            ======================================================== */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded border border-slate-200">
          {/* Customer Column */}
          <div className="space-y-1 border-r border-slate-200 pr-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="h-2.5 w-2.5" /> Billed To
            </p>
            <p className="text-sm font-black text-slate-900 leading-tight truncate">
              {customerName || "Valued Customer"}
            </p>
            <div className="flex items-center gap-1 text-slate-800 font-semibold text-[11px]">
              <Phone className="h-3 w-3 text-blue-600 shrink-0" />
              <span className="font-mono font-bold text-slate-900">
                {customerPhone && customerPhone.trim() ? customerPhone : "N/A (No phone provided)"}
              </span>
            </div>
          </div>

          {/* Invoice Meta Column */}
          <div className="space-y-1 pl-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bill Ref #:</span>
              <span className="font-mono font-black text-xs text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {billNo || "#GS-0000"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-600">
              <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Date:</span>
              <span className="font-medium text-slate-900">{displayDate}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Status:</span>
              {isFullyPaid ? (
                <span className="text-emerald-700 font-black text-[10px] uppercase bg-emerald-100/80 px-1.5 py-0.2 rounded">
                  ✓ Paid Full
                </span>
              ) : (
                <span className="text-orange-700 font-black text-[10px] uppercase bg-orange-100/80 px-1.5 py-0.2 rounded">
                  Step {paymentStep} (Due)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================
            3. ITEMIZED SERVICES / PRODUCTS TABLE
            ======================================================== */}
        <div className="mb-3 border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="py-1.5 px-2.5 text-left w-8">#</th>
                <th className="py-1.5 px-2 text-left">Service / Item Description</th>
                <th className="py-1.5 px-2.5 text-right w-24">Price (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-2.5 text-slate-400 font-mono text-[10px]">{index + 1}</td>
                    <td className="py-1.5 px-2 font-medium text-slate-900">{item.name}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                      Rs. {Number(item.price).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 px-2.5 text-slate-400 font-mono text-[10px]">1</td>
                  <td className="py-2 px-2 font-medium text-slate-900">Photography / Studio Services</td>
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                    Rs. {Number(totalAmount).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================================
            4. FINANCIAL TOTALS BREAKDOWN
            ======================================================== */}
        <div className="flex justify-end mb-3">
          <div className="w-64 space-y-1.5 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
            {/* Subtotal if discount applied */}
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

            {/* Total Invoiced */}
            <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-200 pt-1">
              <span>Total Amount:</span>
              <span className="font-mono">Rs. {Number(totalAmount).toLocaleString()}</span>
            </div>

            {/* Paid Amount */}
            <div className="flex justify-between text-emerald-700 font-bold text-xs">
              <span>Paid Amount:</span>
              <span className="font-mono">Rs. {Number(paidAmount).toLocaleString()}</span>
            </div>

            {/* Outstanding Balance */}
            <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-slate-300">
              <span className={balanceDue > 0 ? "text-red-700" : "text-emerald-700"}>
                {balanceDue > 0 ? "Balance Due:" : "Balance Settled:"}
              </span>
              <span className={`font-mono text-sm ${balanceDue > 0 ? "text-red-700" : "text-emerald-700"}`}>
                Rs. {Number(balanceDue).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================
            5. MULTI-STEP INSTALLMENT NOTICE
            ======================================================== */}
        <div className="mb-3 p-1.5 rounded text-center text-[11px] font-bold border">
          {isFullyPaid ? (
            <div className="text-emerald-800 bg-emerald-50 border-emerald-200 py-0.5">
              ✓ FULL PAYMENT COMPLETED — NO BALANCE DUE
            </div>
          ) : (
            <div className="text-blue-900 bg-blue-50 border-blue-200 py-0.5">
              STEP {paymentStep} ADVANCE RECORDED • REMAINING BALANCE: Rs. {Number(balanceDue).toLocaleString()}
            </div>
          )}
        </div>

        {/* ========================================================
            6. TERMS & SIGNATURE BLOCK
            ======================================================== */}
        <div className="border-t border-slate-200 pt-3 mt-1">
          <div className="flex justify-between items-end text-[10px] text-slate-600 mb-2">
            <div className="text-center w-36">
              <div className="border-b border-slate-400 mb-1 h-6"></div>
              <p className="font-semibold uppercase text-slate-500">Customer Signature</p>
            </div>
            <div className="text-center text-[9px] text-slate-400 italic max-w-[160px] leading-tight">
              Please present this invoice for album &amp; photo collections.
            </div>
            <div className="text-center w-40">
              <div className="border-b border-slate-400 mb-1 h-6"></div>
              <p className="font-semibold uppercase text-slate-500">Authorized Studio Seal</p>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 font-medium pt-1 border-t border-slate-100">
            Godage Studio • Hotline / WhatsApp: 0715926263 • Thank you for your business!
          </div>
        </div>
      </div>

      {/* On-Screen Print Action Buttons */}
      <div className="flex items-center gap-3 w-full max-w-[520px] mt-4 no-print">
        <Button 
          onClick={handlePrint}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print A5 Invoice Receipt
        </Button>
        {onClose && (
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-11 px-5 text-sm font-semibold text-slate-700"
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
