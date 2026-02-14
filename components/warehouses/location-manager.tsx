'use client';
import React from 'react';
import { Box, Plus, Trash2 } from 'lucide-react';

export default function LocationManager({ floor, onBack }: any) {
  const locations = [
    { sku: '01-12-A1', status: 'Occupied', item: 'Piston-X9' },
    { sku: '01-12-A2', status: 'Empty', item: '--' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
       <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest"><ArrowLeft size={16} /> Back to Floors</button>
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-space-grotesk font-bold text-[#1A1C1E]">{floor.label} <span className="text-slate-300">/</span> Locations</h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#08677A] text-white text-xs font-bold"><Plus size={16} /> Add SKU</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left font-inter">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location SKU (XX-YY-ZZ)</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-mono">
            {locations.map(loc => (
              <tr key={loc.sku}>
                <td className="px-8 py-4 text-[#08677A] font-bold">{loc.sku}</td>
                <td className="px-8 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${loc.status === 'Empty' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>{loc.status}</span>
                </td>
                <td className="px-8 py-4 text-right"><button className="text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}