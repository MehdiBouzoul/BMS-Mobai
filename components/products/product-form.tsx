'use client';
import React, { useState } from 'react';
import { X, Info, Loader2, Hash, Package, Scale } from 'lucide-react';
import { createProduct, updateProduct } from '@/services/products';

export default function ProductForm({ product, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    skuCode: product?.sku_code || '',
    name: product?.name || '',
    weightKg: product?.weight_kg || 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = product 
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (result.success) onSuccess();
    else { setError(result.error); setLoading(false); }
  };

  return (
    <div className="bg-white h-full flex flex-col font-inter">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <h2 className="text-xl font-space-grotesk font-bold text-[#08677A]">
          {product ? 'Edit Product' : 'New SKU Registration'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-8 space-y-6 overflow-y-auto">
        {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs flex gap-2"><Info size={16}/> {error}</div>}

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> SKU Code</label>
          <input 
            required 
            className="w-full p-4 rounded-2xl border border-slate-200 bg-white font-mono text-sm uppercase text-slate-900 placeholder-slate-400 outline-none focus:border-[#08677A] focus:ring-4 focus:ring-[#08677A]/5 transition-all" 
            placeholder="E.G. WH-001"
            value={formData.skuCode} 
            onChange={e => setFormData({...formData, skuCode: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Package size={12}/> Item Name</label>
          <input 
            required 
            className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#08677A] focus:ring-4 focus:ring-[#08677A]/5 transition-all" 
            placeholder="E.G. Industrial Compressor"
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Scale size={12}/> Weight (KG)</label>
          <input 
            type="number" step="0.01" 
            className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#08677A] focus:ring-4 focus:ring-[#08677A]/5 transition-all" 
            value={formData.weightKg} 
            onChange={e => setFormData({...formData, weightKg: parseFloat(e.target.value)})} 
          />
        </div>
      </form>

      <div className="p-6 border-t border-slate-50 flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border border-slate-200 font-bold text-sm text-slate-500">Cancel</button>
        <button disabled={loading} onClick={handleSubmit} className="flex-1 py-4 rounded-2xl bg-[#08677A] text-white font-bold text-sm flex justify-center items-center shadow-lg shadow-[#08677A]/20">
          {loading ? <Loader2 className="animate-spin" size={18}/> : 'Save Product'}
        </button>
      </div>
    </div>
  );
}