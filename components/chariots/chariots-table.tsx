'use client';
import React from 'react';
import { Truck, Trash2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { deleteChariot } from '@/services/chariot';

export default function ChariotTable({ chariots, onRefresh }: any) {
  const handleDelete = async (id: string) => {
    if (confirm("Remove this chariot from the fleet?")) {
      await deleteChariot(id);
      onRefresh();
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset ID</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Operational Status</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {chariots.map((c: any) => (
            <tr key={c.id} className="hover:bg-slate-50/40 transition-all group">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 text-[#08677A] rounded-2xl group-hover:bg-[#08677A] group-hover:text-white transition-all">
                    <Truck size={20} />
                  </div>
                  <span className="font-bold text-slate-900 font-space-grotesk uppercase tracking-tight">{c.chariot_number}</span>
                </div>
              </td>
              <td className="px-8 py-5 text-center">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(c.status)}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-8 py-5 text-right">
                <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}