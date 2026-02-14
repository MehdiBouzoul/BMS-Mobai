'use client';
import React, { useState } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';
import WarehouseTable from '@/components/warehouses/warehouse-table';
import WarehouseForm from '@/components/warehouses/warehouse-form';
import FloorManager from '@/components/warehouses/floor-manager';
import LocationManager from '@/components/warehouses/location-manager';
import ConfirmDeleteModal from '@/components/warehouses/confirm-delete-modal';
import { Plus } from 'lucide-react';

export default function WarehousesPage() {
  const [view, setView] = useState<'warehouse' | 'floor' | 'location'>('warehouse');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Central State for Warehouses
  const [warehouses, setWarehouses] = useState([
    { id: '1', name: 'Algiers Central Hub', code: 'DZ-AL-01', floorCount: 2 }
  ]);
  
  const [activeWarehouse, setActiveWarehouse] = useState<any>(null);
  const [activeFloor, setActiveFloor] = useState<any>(null);
  const [whToDelete, setWhToDelete] = useState<any>(null);

  // Sync function for live table updates
  const updateFloorCount = (warehouseId: string, newCount: number) => {
    setWarehouses(prev => prev.map(wh => 
      wh.id === warehouseId ? { ...wh, floorCount: newCount } : wh
    ));
  };

  const deleteWarehouse = () => {
    setWarehouses(warehouses.filter(w => w.id !== whToDelete.id));
    setWhToDelete(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F1F4F9] relative overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="p-8 space-y-8 overflow-y-auto">
          {view === 'warehouse' && (
            <>
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-space-grotesk font-bold text-slate-900">Warehouse Infrastructure</h1>
                  <p className="text-slate-600 font-inter text-sm mt-1">Configure physical assets and multi-floor routing.</p>
                </div>
                <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#08677A] text-white font-inter font-bold text-sm shadow-lg shadow-[#08677A]/20 transition-transform active:scale-95">
                  <Plus size={18} /> New Warehouse
                </button>
              </div>
              <WarehouseTable 
                warehouses={warehouses} 
                onManageFloors={(wh: any) => { setActiveWarehouse(wh); setView('floor'); }} 
                onDeleteClick={(wh: any) => setWhToDelete(wh)}
              />
            </>
          )}

          {view === 'floor' && (
            <FloorManager 
              warehouse={activeWarehouse} 
              onBack={() => setView('warehouse')}
              onUpdateFloorCount={(count: number) => updateFloorCount(activeWarehouse.id, count)}
              onManageLocations={(floor: any) => { setActiveFloor(floor); setView('location'); }}
            />
          )}

          {view === 'location' && (
            <LocationManager floor={activeFloor} onBack={() => setView('floor')} />
          )}
        </main>
      </div>

      <ConfirmDeleteModal 
        isOpen={!!whToDelete}
        title={whToDelete?.name}
        onConfirm={deleteWarehouse}
        onCancel={() => setWhToDelete(null)}
      />

      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-in fade-in" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-[450px] bg-white z-50 shadow-2xl">
             <WarehouseForm onClose={() => setIsDrawerOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}