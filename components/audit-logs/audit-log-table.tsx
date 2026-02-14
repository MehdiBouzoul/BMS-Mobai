'use client';
import React from 'react';
import { Fingerprint, Download } from 'lucide-react';

const LOG_DATA = [
  { time: '2023-10-27T14:22:01.002Z', userId: 'ADMIN_0x88912', description: 'MANUAL_OVERRIDE_APPLIED', objectId: 'BOT_ALPHA_09', state: 'VERIFIED' },
  { time: '2023-10-27T14:19:44.912Z', userId: 'Supervisor_0x412', description: 'REBALANCE_ALGORITHM_INIT', objectId: 'CLUSTER_B_WEST', state: 'VERIFIED' },
  { time: '2023-10-27T14:15:22.118Z', userId: 'Employee_W_772', description: 'LOGIN_SUCCESS_MOBILE', objectId: 'IP_192.168.1.104', state: 'VERIFIED' },
  { time: '2023-10-27T14:12:01.002Z', userId: 'ADMIN_ox4729', description: 'LOW_BATTERY_REROUTE', objectId: 'BOT_BETA_04', state: 'VERIFIED' },
];

export default function AuditLogsTable() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Table Header Action */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Fingerprint className="text-[#08677A]" size={24} />
          <h2 className="text-xl font-space-grotesk font-bold text-[#08677A]">Immutable Audit Log</h2>
        </div>
        <button className="flex items-center gap-2 text-[#08677A] font-inter font-bold text-xs hover:underline">
          Download
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
              <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">User ID</th>
              <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action Description</th>
              <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Object ID</th>
              <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {LOG_DATA.map((log, idx) => (
              <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5 text-[12px] text-slate-500 whitespace-nowrap">
                  {log.time}
                </td>
                <td className={`px-8 py-5 text-[12px] font-bold ${log.userId.includes('ADMIN') ? 'text-[#08677A]' : 'text-slate-400'}`}>
                  {log.userId}
                </td>
                <td className="px-8 py-5 text-[12px] text-slate-500 font-medium">
                  {log.description}
                </td>
                <td className="px-8 py-5 text-[12px] text-slate-500 uppercase">
                  {log.objectId}
                </td>
                <td className="px-8 py-5 text-right">
                  <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                    {log.state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}