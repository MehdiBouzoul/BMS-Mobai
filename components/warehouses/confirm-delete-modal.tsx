import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onConfirm, onCancel, title }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-space-grotesk font-bold text-[#1A1C1E]">Confirm Deletion</h3>
            <p className="text-sm text-slate-500 font-inter mt-2">
              Are you sure you want to delete **{title}**? This action is permanent and may affect linked inventory data.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-4">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 font-inter">
              Cancel
            </button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors font-inter">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}