import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, AlertCircle, RefreshCw, Mail, Calendar } from 'lucide-react';
import { getUsersApi } from '../services/api';

export const CustomersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsersApi();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-navy" />
            <span>Customers &amp; Users</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Directory listing active user accounts, assigned roles, and registered order histories.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-navy border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center space-x-2 shrink-0 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-teal" />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center text-sm text-slate-500 space-y-3 shadow-xs">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-navy rounded-full animate-spin mx-auto"></div>
          <p>Loading user profiles...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-800">No users found in directory</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 font-bold">User ID</th>
                  <th className="px-5 py-4 font-bold">Full Name</th>
                  <th className="px-5 py-4 font-bold">Email Address</th>
                  <th className="px-5 py-4 font-bold">Assigned Role</th>
                  <th className="px-5 py-4 font-bold">Total Orders</th>
                  <th className="px-5 py-4 font-bold text-right">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isAdminUser = u.role === 'ADMIN';
                  const initials = (u.name || 'User').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-bold text-navy">#{u.id}</td>
                      <td className="px-5 py-4 font-bold text-navy">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shadow-xs ${
                            isAdminUser
                              ? 'bg-sky-light text-navy border border-sky/50'
                              : 'bg-beige text-navy border border-amber-200/60'
                          }`}>
                            {initials}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isAdminUser
                            ? 'bg-sky-light text-navy border-sky/50'
                            : 'bg-beige text-navy border-amber-200/60'
                        }`}>
                          {isAdminUser ? <Shield className="w-3.5 h-3.5 text-teal" /> : <UserCheck className="w-3.5 h-3.5 text-teal" />}
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-navy">
                        {u.order_count !== undefined ? `${u.order_count} Orders` : '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500 font-medium">
                        <div className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
