'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Search, UserPlus, Download, Edit2 } from 'lucide-react';
import { getUsers } from '@/services/users-client';
import type { User, RoleType } from '@/services/users-client';

interface UsersTableProps {
  onCreateClick: () => void;
}

export default function UsersTable({ onCreateClick }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'invited'>('all');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      
      // Add role filter if not "ALL"
      if (roleFilter !== 'ALL') {
        filters.role = roleFilter;
      }
      
      // Add search query if exists
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      // Add status filter
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      const data = await getUsers(filters);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(debounceTimer);
  }, [fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value as RoleType | 'ALL');
  };

  const handleStatusFilterChange = (status: 'all' | 'invited') => {
    setStatusFilter(status);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards would go here as per image CC6624 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-space-grotesk font-bold text-[#1A1C1E]">User & Access Management</h1>
          <p className="text-slate-500 font-inter text-sm mt-1">Manage warehouse personnel roles and system access.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-inter font-bold text-sm text-slate-600 shadow-sm hover:bg-slate-50">
            <Download size={18} /> Export List
          </button>
          <button 
            onClick={onCreateClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#08677A] text-white font-inter font-bold text-sm shadow-lg shadow-[#08677A]/20"
          >
            <UserPlus size={18} /> Create User
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full py-2.5 pl-12 pr-4 font-inter text-sm text-slate-900 placeholder:text-slate-400 border-none focus:ring-0 bg-transparent" 
          />
        </div>
        <div className="flex items-center gap-4 border-l pl-4 border-slate-100">
          <select 
            value={roleFilter}
            onChange={handleRoleFilterChange}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 font-inter font-semibold text-xs text-slate-700 uppercase tracking-widest outline-none cursor-pointer hover:border-[#08677A] focus:border-[#08677A] focus:ring-2 focus:ring-[#08677A]/10 transition-all shadow-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
          <div className="flex bg-[#F1F4F9] p-1 rounded-lg">
            <button 
              onClick={() => handleStatusFilterChange('all')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === 'all' 
                  ? 'bg-[#08677A] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => handleStatusFilterChange('invited')}
              className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === 'invited' 
                  ? 'bg-[#08677A] text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Invited
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 font-inter">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-inter">{error}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-inter">User Details</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-inter text-center">Role</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-inter">Status</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest font-inter text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <p className="text-slate-400 font-inter text-sm">
                      {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'all' 
                        ? 'No users found matching your filters.' 
                        : 'No users found. Create your first user to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-slate-600 font-bold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-inter font-bold text-sm text-[#1A1C1E]">{user.name}</p>
                          <p className="font-inter text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                        user.role === 'ADMIN' ? 'bg-cyan-50 text-cyan-600' : 
                        user.role === 'SUPERVISOR' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                        user.status === 'active' ? 'bg-green-50 text-green-600' : 
                        user.status === 'invited' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-slate-300 hover:text-[#08677A]"><Edit2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}