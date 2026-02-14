'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';
import OverrideCalendar from '@/components/overrides/override-calendar';
import OverrideDetailsView from '@/components/overrides/override-details-view';
import OverrideSidebar from '@/components/overrides/override-sidebar';
import { ShoppingCart, FileText, Package, MapPin } from 'lucide-react';

const CATEGORIES = [
  { id: 'purchase', title: 'Bon de commande', subtitle: 'Purchase orders review', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'prep', title: 'Bon de préparation', subtitle: 'Preparation slips', icon: ShoppingCart, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'storage', title: 'Storage', subtitle: 'Inventory placement AI', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'picking', title: 'Picking Route', subtitle: 'Optimal path optimization', icon: MapPin, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

function getDateStatus(date: Date): 'today' | 'tomorrow' | 'past' | 'future' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return 'today';
  if (d.getTime() === tomorrow.getTime()) return 'tomorrow';
  if (d.getTime() < today.getTime()) return 'past';
  return 'future';
}

export default function OverridesPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const dateStatus = getDateStatus(selectedDate);
  const isReadOnly = dateStatus === 'past';
  const isOverridable = dateStatus === 'today' || dateStatus === 'tomorrow';

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedCategory(null);
    setSelectedTask(null);
  };

  const handleOverrideClick = (task: any) => {
    if (isReadOnly) return;
    setSelectedTask(task);
  };

  const handleOverrideComplete = (id: string) => {
    setSelectedTask(null);
  };

  const getDateLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);

    if (sel.getTime() === today.getTime()) return 'Today';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (sel.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex min-h-screen bg-[#F1F4F9]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="p-8 flex gap-8 h-full">
          
          {/* Left: Main Content */}
          <div className="flex-1 space-y-8">
            <header>
              <h1 className="text-3xl font-space-grotesk font-bold text-[#1A1C1E]">
                System Decision Overrides
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full
                  ${isOverridable ? 'bg-[#08677A]/10 text-[#08677A]' : 'bg-slate-100 text-slate-400'}
                `}>
                  {getDateLabel()}
                </span>
                {isReadOnly && (
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-50 text-amber-600">
                    Archived Mode
                  </span>
                )}
                {isOverridable && (
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600">
                    Live — Overridable
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <StatCard label="Pending AI Decisions" value="24" />
                <StatCard label="Manual Overrides (24h)" value="12" />
                <StatCard label="AI System Confidence" value="88.4%" />
              </div>
            </header>

            {!selectedCategory ? (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {isReadOnly ? 'Archived Categories' : 'Decision Categories'}
                </h2>
                {CATEGORIES.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="w-full flex items-center gap-6 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className={`p-4 rounded-2xl ${cat.bg} ${cat.color}`}>
                      <cat.icon size={24} />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-space-grotesk font-bold text-lg text-[#1A1C1E]">{cat.title}</h3>
                      <p className="text-slate-400 text-sm font-inter">{cat.subtitle}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                      <span className="text-xs font-bold text-[#08677A] uppercase tracking-widest">
                        {isReadOnly ? 'View Logs' : 'View Queue'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <OverrideDetailsView 
                category={selectedCategory} 
                isReadOnly={isReadOnly}
                onBack={() => setSelectedCategory(null)}
                onOverrideClick={handleOverrideClick}
              />
            )}
          </div>

          {/* Right: Calendar Sidebar */}
          <aside className="w-80 space-y-6">
            <OverrideCalendar 
              onDateSelect={handleDateSelect} 
              currentDate={new Date()}
              selectedDate={selectedDate}
            />
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Indicators</h4>
              <div className="space-y-3">
                <Indicator color="bg-[#FF7D1F]" label="Pending Override (Today/Tomorrow)" />
                <Indicator color="bg-emerald-500" label="Approved" />
                <Indicator color="bg-slate-300" label="Archived" />
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Override Sidebar Overlay */}
      {selectedTask && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-in fade-in duration-300" 
          onClick={() => setSelectedTask(null)}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-100 ${
        selectedTask ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {selectedTask && (
          <OverrideSidebar 
            task={selectedTask} 
            onClose={() => setSelectedTask(null)} 
            onActionComplete={handleOverrideComplete}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-inter">{label}</p>
      <p className="text-3xl font-space-grotesk font-bold text-[#1A1C1E] mt-2">{value}</p>
    </div>
  );
}

function Indicator({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase font-inter">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}