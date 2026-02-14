'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { warehouseService, WarehouseWithSummary } from '@/services/warehouses';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import WarehouseTable from '@/components/warehouses/warehouse-table';
import WarehouseForm from '@/components/warehouses/warehouse-form';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function WarehousesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [warehouses, setWarehouses] = useState<WarehouseWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehouseService.getAllWithSummary();
      setWarehouses(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading warehouses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageFloors = (warehouse: WarehouseWithSummary) => {
    router.push(`/warehouses/${warehouse.id}/floors`);
  };

  const handleDeleteClick = async (warehouse: WarehouseWithSummary) => {
    if (!confirm(`${t('warehouse', 'deleteConfirm')} "${warehouse.name}"? ${t('warehouse', 'deleteWarning')}`)) {
      return;
    }
    
    try {
      await warehouseService.delete(warehouse.id);
      await loadWarehouses();
    } catch (err: any) {
      console.error('Error deleting warehouse:', err);
      alert(`${t('common', 'error')}: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#08677A] mx-auto"></div>
          <p className="mt-4 text-sm text-slate-600">{t('warehouse', 'loadingWarehouses')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('warehouse', 'title')}</h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('warehouse', 'subtitle')}
              </p>
            </div>
            <Button onClick={() => setSidebarOpen(true)} className="shadow-sm bg-[#08677A] hover:bg-[#065464]">
              <Plus className="mr-2 h-4 w-4" />
              {t('warehouse', 'newFacility')}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {t('common', 'error')}: {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('warehouse', 'totalFacilities')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{warehouses.length}</p>
              </div>
              <div className="h-12 w-12 bg-[#08677A]/10 rounded-xl flex items-center justify-center">
                <div className="h-6 w-6 bg-[#08677A] rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('warehouse', 'totalFloors')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {warehouses.reduce((sum, wh) => sum + wh.floors_count, 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <div className="h-6 w-6 bg-green-600 rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('warehouse', 'totalLocations')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {warehouses.reduce((sum, wh) => sum + wh.locations_count, 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <div className="h-6 w-6 bg-purple-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <WarehouseTable
          warehouses={warehouses}
          onManageFloors={handleManageFloors}
          onDeleteClick={handleDeleteClick}
        />
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="ml-auto relative w-full max-w-md bg-white shadow-xl h-full overflow-y-auto p-8">
            <h2 className="text-2xl font-bold text-[#1A1C1E] mb-6">{t('warehouse', 'newFacility')}</h2>
            <WarehouseForm
              onClose={() => setSidebarOpen(false)}
              onCreated={loadWarehouses}
            />
          </div>
        </div>
      )}
    </div>
  );
}
