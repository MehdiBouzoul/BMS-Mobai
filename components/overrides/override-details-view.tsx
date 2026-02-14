'use client';
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import OverrideTable from './override-table';

// Mock tasks per category
const MOCK_TASKS: Record<string, any[]> = {
  purchase: [
    { id: '#TASK-8821', category: 'PURCHASE ORDER', type: 'AI', result: 'Reject Transaction', title: 'Purchase order exceeds budget threshold' },
    { id: '#TASK-8822', category: 'PURCHASE ORDER', type: 'SUPERVISOR', result: 'Pending Approval', title: 'Vendor not in approved list' },
  ],
  prep: [
    { id: '#TASK-9001', category: 'PREPARATION', type: 'AI', result: 'Reject Slip', title: 'Stock mismatch on preparation slip' },
    { id: '#TASK-9002', category: 'PREPARATION', type: 'AI', result: 'Pending Approval', title: 'Partial fulfillment recommended' },
  ],
  storage: [
    { id: '#TASK-9101', category: 'STORAGE', type: 'AI', result: 'Relocate Item', title: 'AI suggests zone B for optimal storage' },
  ],
  picking: [
    { id: '#TASK-9201', category: 'PICKING ROUTE', type: 'AI', result: 'Reroute Path', title: 'Congestion detected on aisle 4' },
    { id: '#TASK-9202', category: 'PICKING ROUTE', type: 'SUPERVISOR', result: 'Pending Approval', title: 'Manual route override requested' },
  ],
};

interface OverrideDetailsViewProps {
  category: string;
  isReadOnly: boolean;
  onBack: () => void;
  onOverrideClick: (task: any) => void;
}

export default function OverrideDetailsView({ category, isReadOnly, onBack, onOverrideClick }: OverrideDetailsViewProps) {
  const [tasks, setTasks] = React.useState(MOCK_TASKS[category] || []);

  const handleApprove = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const categoryNames: Record<string, string> = {
    purchase: 'Bon de commande',
    prep: 'Bon de préparation',
    storage: 'Storage',
    picking: 'Picking Route',
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-[#08677A] font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Categories
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isReadOnly ? 'bg-slate-100 text-slate-400' : 'bg-[#08677A]/10 text-[#08677A]'}`}>
            {isReadOnly ? 'Read Only — Archived' : 'Live — Overridable'}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-space-grotesk font-bold text-[#1A1C1E]">
          {categoryNames[category] || category}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isReadOnly ? 'Viewing archived decisions' : 'Review and override AI decisions'}
        </p>
      </div>

      <OverrideTable
        tasks={tasks}
        onRowClick={onOverrideClick}
        onApprove={handleApprove}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}