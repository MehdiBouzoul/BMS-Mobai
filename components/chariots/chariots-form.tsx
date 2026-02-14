'use client';
import React, { useState } from 'react';
import { X, Truck, Loader2 } from 'lucide-react';
import { createChariotResilient } from '@/services/chariot';

export default function ChariotForm({ onClose, onSuccess }: any) {
  const [num, setNum] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!num.trim()) return;
    
    setLoading(true);
    
    // Call the resilient service
    const res = await createChariotResilient(num);
    
    if (res.success) {
      onSuccess(res.data, res.mode);
      onClose();
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-inter">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <h2 className="text-xl font-space-grotesk font-bold text-[#08677A]">Add Chariot Asset</h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20}/></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chariot Identification</label>
          <input 
            required 
            autoFocus
            className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold text-lg outline-none focus:border-[#08677A] focus:ring-4 focus:ring-[#08677A]/5 transition-all placeholder:text-slate-300" 
            placeholder="e.g. CART-001"
            value={num} 
            onChange={e => setNum(e.target.value)} 
          />
        </div>
        
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
          <div className="w-1 h-full bg-amber-400 rounded-full" />
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            If your session has expired, the chariot will appear in the list below for this session only but will not be saved permanently.
          </p>
        </div>
      </form>

      <div className="p-6 border-t border-slate-50">
        <button 
          disabled={loading || !num.trim()} 
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-[#08677A] text-white font-bold flex justify-center items-center gap-2 shadow-lg shadow-[#08677A]/20 hover:opacity-95 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
        >
          {loading ? <Loader2 className="animate-spin" size={18}/> : <><Truck size={18}/> Confirm & Add</>}
        </button>
      </div>
    </div>
  );
}