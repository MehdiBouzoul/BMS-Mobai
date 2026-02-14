import React from 'react';
import { Users, Warehouse, Package, Activity } from 'lucide-react';
import StatsCard from '../../components/dashboard/stats-card';
import RecentActivity from '../../components/dashboard/recent-activity';

export default function DashboardPage() {
  return (
    <div className="space-y-8 w-full">
      {/* Page Title */}
      <div>
        <h1 className="font-space-grotesk font-bold text-2xl text-[#1A1C1E]">
          Dashboard
        </h1>
        <p className="font-inter text-sm text-slate-500 mt-1">
          Overview of warehouse operations
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={124}
          icon={Users}
          href="/dashboard/users"
        //   trend={{ value: "+12%", isPositive: true }}
        />
        <StatsCard
          title="Warehouses"
          value={3}
          icon={Warehouse}
          href="/dashboard/warehouses"
        />
        <StatsCard
          title="Active SKUs"
          value={1842}
          icon={Package}
          href="/dashboard/products"
        //   trend={{ value: "+5.2%", isPositive: true }}
        />
        <StatsCard
          title="Operations Today"
          value={67}
          icon={Activity}
          href="/dashboard/inventory"
        //   trend={{ value: "-3%", isPositive: false }}
        />
      </div>

      {/* Recent Activity Table */}
      <div className="w-full">
        <RecentActivity />
      </div>
    </div>
  );
}