'use client';
import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, Users } from 'lucide-react'; // Added Users here

interface OverrideSidebarProps {
  task: any;
  onClose: () => void;
  onActionComplete: (id: string) => void;
}

export default function OverrideSidebar({ task, onClose, onActionComplete }: OverrideSidebarProps) {
  const [actionType, setActionType] = useState<'force' | 'manual' | null>(null);

  const handleConfirm = () => {
    onActionComplete(task.id);
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-2xl font-inter">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-[#08677A]" size={20} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#08677A] font-space-grotesk">Override Panel</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600 tracking-wider">ACTIVE TARGET</span>
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-700">{task.id}</span>
          </div>
          <p className="font-bold text-slate-900 text-sm leading-tight">{task.title}</p>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">Select Admin Action</label>
          <div className="space-y-3">
            <div 
              onClick={() => setActionType('force')}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${actionType === 'force' ? 'border-[#08677A] bg-slate-50' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-4">
                <CheckCircle size={18} className={actionType === 'force' ? 'text-[#08677A]' : 'text-slate-400'} />
                <span className="text-sm font-bold text-slate-800">Force Decision</span>
              </div>
            </div>

            <div 
              onClick={() => setActionType('manual')}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${actionType === 'manual' ? 'border-[#08677A] bg-slate-50' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-4">
                <Users size={18} className={actionType === 'manual' ? 'text-[#08677A]' : 'text-slate-400'} />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">Manually Assign</p>
                  <p className="text-[10px] text-slate-500">Route to specialized human agent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Manual Fields */}
        {actionType === 'manual' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600">QUANTITY</label>
                <input type="number" className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:border-[#08677A]" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600">LOCATION</label>
                <input type="text" className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:border-[#08677A]" placeholder="e.g. A-102" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-200">
        <button 
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-[#FF7D1F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#e66f1a] transition-colors shadow-lg shadow-orange-200 uppercase tracking-wider font-inter"
        >
          Confirm Administrative Override ➔
        </button>
      </div>
    </div>
  );
}