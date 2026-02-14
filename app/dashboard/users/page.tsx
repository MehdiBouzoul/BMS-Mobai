'use client';
import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/dashboard/sidebar';
import Navbar from '@/components/dashboard/navbar';
import UsersTable from '@/components/users/users-table';
import UserForm from '@/components/users/user-form';

export default function UsersPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F1F4F9] relative overflow-hidden">
      {/* PERSISTENT SIDEBAR */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="p-8">
          {/* Main User Management Table */}
          <UsersTable 
            onCreateClick={() => setIsDrawerOpen(true)}
            key={refreshTrigger}
          />
        </main>
      </div>

      {/* --- SIDE DRAWER SYSTEM --- */}
      {/* 1. Blurred Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* 2. Slide-in Panel */}
      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {isDrawerOpen && (
          <UserForm 
            onClose={() => setIsDrawerOpen(false)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}