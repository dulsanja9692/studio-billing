"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, ShoppingCart, Package, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/authActions";

export default function Sidebar() {
  const pathname = usePathname();

  const navGroups = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Customers", href: "/customers", icon: Users },
      ],
    },
    {
      label: "Sales",
      items: [
        { name: "POS", href: "/pos", icon: ShoppingCart },
        { name: "Products", href: "/Product", icon: Package },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r bg-white flex flex-col h-full shrink-0">
      {/* Logo Section */}
      <div className="h-16 border-b flex items-center gap-3 px-6 font-semibold text-lg shrink-0">
        <Image 
          src="/logo.jpg" 
          alt="Godage Studio Logo" 
          width={30} 
          height={30} 
          style={{ height: "auto" }}
          className="rounded-sm object-contain shrink-0"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">GODAGE STUDIO</span>
          <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase">Management System</span>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            {/* Group Label (Overview/Sales) */}
            <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {group.label}
            </h3>
            
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? "bg-blue-50 text-blue-600" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Section */}
      <div className="p-3 border-t">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}