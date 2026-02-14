'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';
import ChariotTable from '@/components/chariots/chariots-table';
import ChariotForm from '@/components/chariots/chariots-form';
import { listChariots, Chariot } from '@/services/chariot';
import { Plus, Truck, Loader2, AlertCircle } from 'lucide-react';

export default function ChariotsPage() {
  const [chariots, setChariots] = useState<Chariot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [syncWarning, setSyncWarning] = useState(false);

  // 1. Initial Data Fetch
  const fetchChariots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listChariots();
      if (res.success) {
        setChariots(res.data || []);
      } else {
        // If DB fetch fails, we keep the list empty but don't crash
        // console.error("Database fetch failed, operating in local mode");
      }
    } catch (err) {
      console.error("Critical error during fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChariots();
  }, [fetchChariots]);

  // 2. Resilient Create Handler
  const handleCreateSuccess = (newChariot: Chariot, mode: 'database' | 'ui-only') => {
    // Immediate UI Update
    setChariots(prev => [newChariot, ...prev]);
    
    // If it didn't save to DB, show a subtle warning badge
    if (mode === 'ui-only') {
      setSyncWarning(true);
      setTimeout(() => setSyncWarning(false), 5000); // Hide after 5 seconds
    }
    
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#F1F4F9] relative overflow-hidden font-inter">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        
        <main className="p-8 space-y-8 overflow-y-auto">
          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-space-grotesk font-bold text-[#1A1C1E]">
                  Chariot Fleet
                </h1>
                {syncWarning && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-200 rounded-full animate-pulse">
                    <AlertCircle size={14} className="text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Local Mode Active</span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Management of physical picking carts and operational availability.
              </p>
            </div>
            
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#08677A] text-white font-bold text-sm shadow-lg shadow-[#08677A]/20 transition-all hover:bg-[#065666] active:scale-95"
            >
              <Plus size={18} /> Add Chariot
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              label="Total Assets" 
              value={chariots.length} 
              icon={<Truck size={20} />}
            />
            <StatCard 
              label="Available" 
              value={chariots.filter(c => c.status === 'available').length} 
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard 
              label="Maintenance" 
              value={chariots.filter(c => c.status === 'maintenance').length} 
              color="text-rose-600"
              bg="bg-rose-50"
            />
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#08677A]" size={32} />
              <p className="text-slate-400 text-sm font-medium">Synchronizing Fleet Data...</p>
            </div>
          ) : (
            <ChariotTable 
              chariots={chariots} 
              onRefresh={fetchChariots} 
            />
          )}
        </main>
      </div>

      {/* Right Side Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setIsDrawerOpen(false)} 
          />
          
          {/* Sidebar Component */}
          <div className="fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl animate-in slide-in-from-right duration-300">
             <ChariotForm 
                onClose={() => setIsDrawerOpen(false)} 
                onSuccess={handleCreateSuccess}
             />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Reusable Stat Card Component 
 */
function StatCard({ label, value, color = "text-slate-900", bg = "bg-white", icon }: any) {
  return (
    <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 ${bg === 'bg-white' ? 'bg-white' : bg}`}>
      {icon && (
        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl">
          {icon}
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          {label}
        </p>
        <p className={`text-3xl font-space-grotesk font-bold mt-1 ${color}`}>
          {value}
        </p>
      </div>
    </div>
  );
}