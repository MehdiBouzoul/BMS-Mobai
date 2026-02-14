'use client';
import React, { useState } from 'react';
import { X, ClipboardList, Search, Plus, Minus, Trash2, Calendar, Clock, Loader2 } from 'lucide-react';

export default function BonneSidebar({ onClose, products }) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [schedule, setSchedule] = useState({
    date: new Date().toISOString().split('T')[0],
    time: "08:00"
  });

  // Filter products for the selection list
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addItem = (product) => {
    const exists = selectedItems.find(item => item.id === product.id);
    if (exists) {
      updateQty(product.id, 1);
    } else {
      setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setSelectedItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCreate = async () => {
    setLoading(true);
    // Simulating API call for Bon de Préparation
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="bg-white h-full flex flex-col font-inter animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#08677A]/10 rounded-lg text-[#08677A]">
            <ClipboardList size={22} />
          </div>
          <h2 className="text-xl font-space-grotesk font-bold text-[#08677A]">New Preparation Slip</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* 1. Scheduling Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Pick Date</label>
            <input type="date" className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm outline-none focus:border-[#08677A]" 
              value={schedule.date} onChange={e => setSchedule({...schedule, date: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Start Time</label>
            <input type="time" className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm outline-none focus:border-[#08677A]" 
              value={schedule.time} onChange={e => setSchedule({...schedule, time: e.target.value})} />
          </div>
        </div>

        {/* 2. Product Search/Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Products to Slip</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search existing SKUs..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-[#08677A]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          {searchQuery && (
            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-slate-50/30">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => addItem(p)} className="w-full p-3 text-left hover:bg-white flex justify-between items-center transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] font-mono text-slate-400">{p.sku_code}</p>
                  </div>
                  <Plus size={16} className="text-[#08677A]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Selected List */}
        <div className="space-y-4 pt-4 border-t border-slate-50">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Items ({selectedItems.length})</h3>
          <div className="space-y-3">
            {selectedItems.map(item => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-[10px] font-mono text-[#08677A] font-bold">{item.sku_code}</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-[#08677A] text-slate-400"><Minus size={14}/></button>
                  <span className="text-sm font-bold text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-[#08677A] text-slate-400"><Plus size={14}/></button>
                </div>
                <button onClick={() => removeItem(item.id)} className="ml-3 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {selectedItems.length === 0 && (
              <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-xs text-slate-400">No items selected yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-50 bg-white">
        <button 
          disabled={selectedItems.length === 0 || loading}
          onClick={handleCreate}
          className="w-full py-4 rounded-2xl bg-[#08677A] text-white font-bold text-sm flex justify-center items-center shadow-lg shadow-[#08677A]/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all"
        >
          {loading ? <Loader2 className="animate-spin" size={18}/> : 'Generate Slip'}
        </button>
      </div>
    </div>
  );
}