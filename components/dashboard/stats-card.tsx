import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, icon: Icon, href, trend }: StatsCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 cursor-pointer hover:shadow-md hover:border-[#08677A]/20 hover:scale-[1.02] transition-all duration-200">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-[#F1F4F9] rounded-lg">
            <Icon size={20} className="text-[#08677A]" />
          </div>
          {trend && (
            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend.value}
            </div>
          )}
        </div>
        <div>
          <p className="text-slate-500 font-inter text-xs uppercase tracking-wider font-semibold">
            {title}
          </p>
          <h3 className="text-2xl font-space-grotesk font-bold text-[#1A1C1E] mt-1">
            {value}
          </h3>
        </div>
      </div>
    </Link>
  );
}