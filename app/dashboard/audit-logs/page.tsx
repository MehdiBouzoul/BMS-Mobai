'use client';
import React from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';
import AuditLogsTable from '@/components/audit-logs/audit-log-table';

export default function AuditLogsPage() {
  return (
    <div className="flex min-h-screen bg-[#F1F4F9]">
      {/* PERSISTENT SIDEBAR */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <Navbar />

        {/* MAIN CONTENT AREA */}
        <main className="p-8 space-y-8 overflow-y-auto">
          {/* Section Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-space-grotesk font-bold text-[#1A1C1E]">
                Security Logs
              </h1>
              <p className="text-slate-500 font-inter text-sm mt-1">
                Real-time, cryptographically signed activity tracking for compliance and safety.
              </p>
            </div>
            
            {/* Filter Toggle - Visual Only for now */}
            {/* <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button className="px-4 py-2 bg-[#08677A] text-white rounded-lg text-xs font-bold font-inter">Live View</button>
              <button className="px-4 py-2 text-slate-400 text-xs font-bold font-inter">Historical</button>
            </div> */}
          </div>

          {/* The Audit Table Card */}
          <AuditLogsTable />

          {/* Verification Footer */}
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">
              System health: Optimal • All logs cryptographically secured
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}