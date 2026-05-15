"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const stats: StatCard[] = [
  {
    title: "Total Customers",
    value: "0",
    change: "+0%",
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Total Orders",
    value: "0",
    change: "+0%",
    trend: "up",
    icon: ShoppingCart,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Revenue",
    value: "Rs. 0",
    change: "+0%",
    trend: "up",
    icon: DollarSign,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    title: "Pending Balance",
    value: "Rs. 0",
    change: "0%",
    trend: "down",
    icon: TrendingUp,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, Admin 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here&apos;s what&apos;s happening with your studio today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`${stat.bgColor} ${stat.color} p-2.5 rounded-lg`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    stat.trend === "up"
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {stat.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Activity
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <ShoppingCart className="h-10 w-10 mb-3" />
          <p className="text-sm font-medium">No recent activity yet</p>
          <p className="text-xs mt-1">
            Orders and payments will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
