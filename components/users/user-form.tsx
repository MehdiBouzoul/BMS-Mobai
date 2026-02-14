'use client';
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createUser } from '@/services/users-client';
import type { RoleType } from '@/services/users-client';

interface UserFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UserForm({ onClose, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as RoleType,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.role) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('Creating user with data:', {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });

      // Create the user
      const result = await createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });

      console.log('User created successfully:', result);

      // Send invitation email
      try {
        const emailResponse = await fetch('/api/send-invitation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: result.id,
            email: result.email,
            name: result.name,
          }),
        });

        const emailResult = await emailResponse.json();
        
        if (!emailResult.success) {
          console.error('Failed to send invitation email:', emailResult.message);
          // Don't throw error, user is already created
        } else {
          console.log('Invitation email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't throw error, user is already created
      }

      setSuccess(true);
      
      // Call success callback and close after a short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating user:', err);
      
      // Extract more detailed error message
      let errorMessage = 'Failed to create user';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center flex-shrink-0">
        <h2 className="text-xl font-space-grotesk font-bold text-[#08677A]">Create New User</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-inter font-semibold mb-1">Error</p>
              <p className="text-sm text-red-600 font-inter">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-600 font-inter font-semibold mb-1">Success!</p>
              <p className="text-sm text-green-600 font-inter">User created successfully. An invitation will be sent to their email.</p>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 tracking-widest font-inter">FULL NAME *</label>
            <input 
              type="text" 
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#08677A]/10 outline-none font-inter text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 tracking-widest font-inter">EMAIL ADDRESS *</label>
            <input 
              type="email" 
              placeholder="j.doe@wms-logistics.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#08677A]/10 outline-none font-inter text-sm text-slate-900 placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400 font-inter">An invitation link will be sent to this email</p>
          </div>

          {/* Role Assignment */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 tracking-widest font-inter">ROLE ASSIGNMENT *</label>
            
            <div className="space-y-3">
              {[
                { id: 'ADMIN' as RoleType, title: 'Administrator', desc: 'Full system access, user management, and configuration.' },
                { id: 'SUPERVISOR' as RoleType, title: 'Supervisor', desc: 'Manage inventory and view reports for specific zones.' },
                { id: 'EMPLOYEE' as RoleType, title: 'Employee', desc: 'Standard access for picking, packing, and shipping.' },
              ].map((role) => (
                <label key={role.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-[#08677A]/30 cursor-pointer transition-all group">
                  <input 
                    type="radio" 
                    name="role" 
                    value={role.id}
                    checked={formData.role === role.id}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleType })}
                    className="mt-1 accent-[#08677A]" 
                  />
                  <div>
                    <p className="font-inter font-bold text-sm text-[#1A1C1E]">{role.title}</p>
                    <p className="font-inter text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0 bg-white">
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-slate-200 font-inter font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-[#08677A] text-white font-inter font-bold text-sm shadow-lg shadow-[#08677A]/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending Invitation...
              </>
            ) : (
              'Send Invitation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}