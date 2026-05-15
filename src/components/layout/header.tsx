"use client";
import Image from "next/image";
import { Bell, UserCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Header() {
  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left Side: Logo & Name */}
      <div className="flex items-center gap-3">
        <Image 
          src="/logo.jpg" 
          alt="Godage Studio Logo" 
          width={32} 
          height={32} 
          style={{ height: "auto" }}
          className="rounded-sm object-contain shrink-0"
        />
        <div className="hidden md:block">
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">GODAGE STUDIO</h1>
          <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase">Management System</p>
        </div>
      </div>

      {/* Middle: Search Bar (Optional but looks professional) */}
      <div className="hidden sm:flex relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input 
          type="search" 
          placeholder="Search customers..." 
          className="pl-9 bg-slate-50 border-slate-200 h-9 text-sm focus-visible:ring-blue-600" 
        />
      </div>

      {/* Right Side: Notifications & Profile */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="text-right hidden xs:block">
            <p className="text-xs font-semibold text-slate-900">Admin</p>
            <p className="text-[10px] text-green-600 font-medium">Online</p>
          </div>
          <UserCircle size={28} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}