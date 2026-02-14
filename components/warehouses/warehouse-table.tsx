'use client';
import React from 'react';
import { Warehouse, Map, Trash2 } from 'lucide-react';
import { WarehouseWithSummary } from '@/services/warehouses';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface WarehouseTableProps {
  warehouses: WarehouseWithSummary[];
  onManageFloors: (warehouse: WarehouseWithSummary) => void;
  onDeleteClick: (warehouse: WarehouseWithSummary) => void;
}

export default function WarehouseTable({ warehouses, onManageFloors, onDeleteClick }: WarehouseTableProps) {
  const { t } = useLanguage();

  if (warehouses.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden font-inter">
        <div className="text-center py-16 px-8">
          <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-4">
            <Warehouse className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{t('warehouse', 'noWarehouses')}</h3>
          <p className="text-sm text-slate-500">{t('warehouse', 'noWarehousesDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden font-inter">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('warehouse', 'facilityDetail')}</th>
            <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('warehouse', 'levels')}</th>
            <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">{t('common', 'actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {warehouses.map((wh) => (
            <tr key={wh.id} className="hover:bg-slate-50/30 transition-colors group">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl text-[#08677A]">
                    <Warehouse size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1A1C1E]">{wh.name}</p>
                    <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{wh.code}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5 text-center">
                <span className="font-space-grotesk font-bold text-lg text-[#08677A]">{wh.floors_count}</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t('warehouse', 'floors')}</p>
              </td>
              <td className="px-8 py-5">
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => onManageFloors(wh)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#08677A] text-white text-xs font-bold shadow-sm hover:bg-[#065464] transition-all"
                  >
                    <Map size={14} /> {t('warehouse', 'manageFloors')}
                  </button>
                  <button 
                    onClick={() => onDeleteClick(wh)}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}