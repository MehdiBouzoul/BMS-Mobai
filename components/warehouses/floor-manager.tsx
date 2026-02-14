'use client';
import React, { useState, useEffect } from 'react';
import { Layers, ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react';
import ConfirmDeleteModal from './confirm-delete-modal';

export default function FloorManager({ warehouse, onBack, onUpdateFloorCount, onManageLocations }: any) {
  // Initialize state based on the warehouse's current count
  const [floors, setFloors] = useState(
    Array.from({ length: warehouse.floorCount }, (_, i) => ({
      id: `f${i + 1}`,
      label: `Floor ${i + 1}`,
      zoneCount: 0
    }))
  );
  
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // This Effect sends the count back to the parent table LIVE
  useEffect(() => {
    onUpdateFloorCount(floors.length);
  }, [floors.length, onUpdateFloorCount]);

  const addFloor = () => {
    const nextNum = floors.length + 1;
    const newFloor = { id: `f${nextNum}`, label: `Floor ${nextNum}`, zoneCount: 0 };
    setFloors([...floors, newFloor]);
  };

  const handleConfirmDelete = () => {
    setFloors(prev => {
      const filtered = prev.filter(f => f.id !== deleteTarget.id);
      // Re-index so floors always follow F1, F2, F3 order
      return filtered.map((f, i) => ({
        ...f,
        id: `f${i + 1}`,
        label: `Floor ${i + 1}`
      }));
    });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-[#08677A] font-bold text-xs uppercase tracking-widest font-inter group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Warehouses
      </button>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-space-grotesk font-bold text-[#1A1C1E]">{warehouse.name}</h2>
          <p className="text-sm text-slate-400 font-inter uppercase tracking-tight">Active Infrastructure Levels</p>
        </div>
        <button 
          onClick={addFloor}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#08677A] text-white text-xs font-bold font-inter shadow-lg shadow-[#08677A]/20 hover:opacity-90 transition-all active:scale-95"
        >
          <Plus size={16} /> Add Floor F{floors.length + 1}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {floors.map(floor => (
          <div key={floor.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-[#08677A]/40 transition-all">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => onManageLocations(floor)}>
              <div className="p-3 bg-[#F1F4F9] text-[#08677A] rounded-2xl group-hover:bg-[#08677A] group-hover:text-white transition-colors duration-300">
                <Layers size={24} />
              </div>
              <div>
                <p className="font-inter font-bold text-[#1A1C1E] uppercase">{floor.label}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{floor.zoneCount} Mapped SKUs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button 
                onClick={() => setDeleteTarget(floor)}
                className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
               >
                <Trash2 size={18} />
              </button>
              <ChevronRight className="text-slate-200 group-hover:text-[#08677A] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <ConfirmDeleteModal 
        isOpen={!!deleteTarget}
        title={deleteTarget?.label}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}