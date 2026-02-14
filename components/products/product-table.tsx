'use client';
import React from 'react';
import { Edit3, Trash2, Package, Scale } from 'lucide-react';
import { deleteProduct } from '@/services/products';

export default function ProductTable({ products, onEdit, onRefresh }) {
  const handleDelete = async (id) => {
    if (confirm("Delete this product permanently?")) {
      const res = await deleteProduct(id);
      if (res.success) onRefresh();
      else alert(res.error);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100 font-inter">
          <tr>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Information</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</th>
            <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/40 transition-all group">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 text-[#08677A] rounded-2xl group-hover:bg-[#08677A] group-hover:text-white transition-all"><Package size={20} /></div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 font-inter">{p.name}</p>
                    <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{p.sku_code}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5 text-sm font-medium text-slate-600 font-inter">{p.weight_kg} kg</td>
              <td className="px-8 py-5">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(p)} className="p-2 text-slate-400 hover:text-[#08677A]"><Edit3 size={18}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={18}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}