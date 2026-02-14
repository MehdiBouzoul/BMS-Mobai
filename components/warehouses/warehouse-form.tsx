'use client';
import React, { useState } from 'react';
import { X, Warehouse, MapPin, Hash, Layers } from 'lucide-react';
import { warehouseService } from '@/services/warehouses';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface WarehouseFormProps {
  onClose: () => void;
  onCreated?: () => void;
}

export default function WarehouseForm({ onClose, onCreated }: WarehouseFormProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      setError(t('warehouseForm', 'codeAndNameRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await warehouseService.create({ code: code.trim(), name: name.trim() });
      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* 1. HEADER SECTION */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#08677A]/10 rounded-lg">
            <Warehouse className="text-[#08677A]" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-space-grotesk font-bold text-[#08677A]">MobAI BMS</h2>
            <p className="text-[10px] font-inter font-bold text-slate-400 uppercase tracking-widest">{t('warehouseForm', 'infrastructureSetup')}</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
        >
          <X size={20} className="text-slate-400 group-hover:text-slate-600" />
        </button>
      </div>

      {/* 2. FORM BODY SECTION */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        
        {/* Core Identity */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-inter flex items-center gap-2">
              <Warehouse size={12} /> {t('warehouseForm', 'warehouseName')}
            </label>
            <input 
              type="text" 
              placeholder={t('warehouseForm', 'warehouseNamePlaceholder')}
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#08677A] focus:ring-2 focus:ring-[#08677A]/20 outline-none font-inter text-sm text-[#1A1C1E] placeholder:text-slate-300 transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-inter flex items-center gap-2">
              <Hash size={12} /> {t('warehouseForm', 'systemCode')}
            </label>
            <input 
              type="text" 
              placeholder={t('warehouseForm', 'systemCodePlaceholder')}
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#08677A] focus:ring-2 focus:ring-[#08677A]/20 outline-none font-mono text-sm text-[#1A1C1E] uppercase placeholder:text-slate-300 placeholder:normal-case transition-all"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>

        {/* Structural Configuration */}
        <div className="space-y-4 pt-4 border-t border-slate-50">
          <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-inter flex items-center gap-2">
            <Layers size={12} /> {t('warehouseForm', 'initialFloorSetup')}
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((num) => (
              <label key={num} className="relative cursor-pointer group">
                <input type="radio" name="floors" className="peer hidden" defaultChecked={num === 1} />
                <div className="py-3 text-center rounded-xl border border-slate-200 peer-checked:border-[#08677A] peer-checked:bg-[#08677A]/5 peer-checked:text-[#08677A] font-inter font-bold text-sm text-slate-500 transition-all">
                  F{num}
                </div>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 font-inter italic">{t('warehouseForm', 'floorNote')}</p>
        </div>

        {/* Location / Geography */}
        <div className="space-y-2 pt-4 border-t border-slate-50">
          <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase font-inter flex items-center gap-2">
            <MapPin size={12} /> {t('warehouseForm', 'physicalAddress')}
          </label>
          <textarea 
            placeholder={t('warehouseForm', 'addressPlaceholder')}
            className="w-full p-4 h-28 rounded-2xl border border-slate-200 text-sm font-inter text-[#1A1C1E] outline-none focus:border-[#08677A] focus:ring-2 focus:ring-[#08677A]/20 placeholder:text-slate-300 resize-none transition-all"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 3. FOOTER ACTION SECTION */}
      <div className="p-6 border-t border-slate-50 flex gap-3 bg-slate-50/20 backdrop-blur-md">
        <button 
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-4 rounded-2xl border border-slate-200 font-inter font-bold text-sm text-slate-600 hover:bg-white hover:shadow-sm transition-all"
        >
          {t('common', 'discard')}
        </button>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-4 rounded-2xl bg-[#08677A] text-white font-inter font-bold text-sm shadow-lg shadow-[#08677A]/20 hover:bg-[#065464] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('warehouseForm', 'saving') : t('warehouseForm', 'saveFacility')}
        </button>
      </div>
    </div>
  );
}