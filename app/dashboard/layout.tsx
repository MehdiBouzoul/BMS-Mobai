"use client";

import React from 'react';
import Sidebar from '../../components/dashboard/navbar';
import Navbar from '../../components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F1F4F9]">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Fixed Navbar */}
      <Navbar />

      {/* Scrollable Content — constrained between sidebar and screen edge */}
      <main className="ml-64 pt-20">
        <div className="p-8 max-w-[calc(100vw-16rem)] overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}