'use client';
import React from 'react';
import { LayoutGrid, AlertCircle, Check, Slash, Archive } from 'lucide-react';

interface OverrideTableProps {
  tasks: any[];
  onRowClick: (task: any) => void;
  onApprove: (id: string) => void;
  isReadOnly?: boolean;
}

export default function OverrideTable({ tasks, onRowClick, onApprove, isReadOnly = false }: OverrideTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
        <Archive className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 className="font-bold text-slate-900 mb-1">No tasks found</h3>
        <p className="text-sm text-slate-400">No decisions available for this date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div 
          key={task.id}
          className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group transition-all
            ${!isReadOnly ? 'hover:border-[#08677A]/30 cursor-pointer' : 'opacity-80'}
          `}
          onClick={() => !isReadOnly && onRowClick(task)}
        >
          <div className="flex items-center gap-6">
            <div className={`p-3 rounded-2xl ${task.type === 'AI' ? 'bg-slate-50' : 'bg-orange-50'}`}>
              {task.type === 'AI' ? <LayoutGrid className="text-slate-400" size={24} /> : <AlertCircle className="text-[#FF7D1F]" size={24} />}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-widest">{task.id}</span>
                <span className="font-inter text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase tracking-tighter">{task.category}</span>
              </div>
              <p className="font-inter font-bold text-sm text-[#1A1C1E]">
                {task.type === 'AI' ? 'AI Recommendation: ' : 'Supervisor Action: '}
                <span className={task.result === 'Approved' ? 'text-emerald-500' : task.result === 'Pending Approval' ? 'text-amber-500' : 'text-rose-500'}>
                  {task.result}
                </span>
              </p>
              <p className="text-xs text-slate-400">• Escalated by J. Miller (Sr. Supervisor)</p>
            </div>
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {isReadOnly ? (
              <span className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-50 text-slate-300 text-xs font-bold border border-slate-100">
                <Archive size={14} /> Archived Log
              </span>
            ) : (
              <>
                
                <button 
                  onClick={() => onRowClick(task)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-200 text-[#08677A] text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  <Slash size={16} className="rotate-45" /> Override
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}