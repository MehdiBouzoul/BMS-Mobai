'use client';
import React from 'react';
import { Search } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-64 right-0 h-20 bg-[#F1F4F9] border-b border-gray-200/50 flex items-center justify-between px-8 z-40">
      {/* Search Bar */}
      <div className="relative w-96 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Global search commands..."
          className="w-full bg-white border-none rounded-full py-2.5 pl-12 pr-12 text-sm font-inter focus:ring-2 focus:ring-[#08677A]/20 transition-all shadow-sm"
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <kbd className="px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono text-slate-400 bg-slate-50">K</kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Language Switcher */}
        <LanguageSwitcher />

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-space-grotesk font-bold text-[#1A1C1E] text-sm">Admin</p>
            <p className="font-mono text-[10px] text-slate-500 uppercase">ID: 0x88912</p>
          </div>
        </div>
      </div>
    </header>
  );
}