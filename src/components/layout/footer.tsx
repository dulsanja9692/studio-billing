"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-10 border-t bg-white px-6 flex items-center justify-between text-[10px] font-medium text-slate-500 shrink-0">
      <div>
        © {currentYear} <span className="font-bold text-slate-700">Godage Studio</span>. All rights reserved.
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>Database: Connected (Local)</span>
        </div>
        <span className="hidden sm:inline text-slate-300">|</span>
        <span className="hidden sm:inline">Version 1.0.0</span>
      </div>
    </footer>
  );
}