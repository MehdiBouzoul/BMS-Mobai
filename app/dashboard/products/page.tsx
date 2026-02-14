'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';
import ProductTable from '@/components/products/product-table';
import ProductForm from '@/components/products/product-form';
import BonneSidebar from '@/components/products/bonne-sidebar'; // NEW
import { listProducts } from '@/services/products';
import { Plus, Package, Search, Loader2, ClipboardList } from 'lucide-react';

export default function ProductsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer States
  const [drawerType, setDrawerType] = useState(null); // 'product' | 'bonne' | null
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = useCallback(async (q = '') => {
    setLoading(true);
    const result = await listProducts({ q }, { page: 1, pageSize: 50 });
    if (result.success) setData(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  return (
    <div className="flex min-h-screen bg-[#F1F4F9] relative overflow-hidden font-inter">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="p-8 space-y-8 overflow-y-auto">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-space-grotesk font-bold text-[#1A1C1E]">Product Catalog</h1>
              <p className="text-slate-500 text-sm mt-1">Manage global SKUs and create preparation slips.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDrawerType('bonne')}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[#08677A] font-bold text-sm shadow-sm transition-all active:scale-95"
              >
                <ClipboardList size={18} /> New Bonne
              </button>
              <button 
                onClick={() => { setSelectedProduct(null); setDrawerType('product'); }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#08677A] text-white font-bold text-sm shadow-lg shadow-[#08677A]/20 transition-all active:scale-95"
              >
                <Plus size={18} /> New Product
              </button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search SKU or Name..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none text-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#08677A]" size={32} /></div>
          ) : (
            <ProductTable 
              products={data?.data || []} 
              onEdit={(p) => { setSelectedProduct(p); setDrawerType('product'); }}
              onRefresh={() => fetchProducts(searchQuery)}
            />
          )}
        </main>
      </div>

      {/* Unified Side Drawer Container */}
      {drawerType && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setDrawerType(null)} />
          <div className="fixed top-0 right-0 h-full w-[480px] bg-white z-50 shadow-2xl animate-in slide-in-from-right">
             {drawerType === 'product' && (
               <ProductForm 
                  product={selectedProduct} 
                  onClose={() => setDrawerType(null)} 
                  onSuccess={() => { setDrawerType(null); fetchProducts(searchQuery); }}
               />
             )}
             {drawerType === 'bonne' && (
               <BonneSidebar 
                  products={data?.data || []}
                  onClose={() => setDrawerType(null)} 
               />
             )}
          </div>
        </>
      )}
    </div>
  );
}