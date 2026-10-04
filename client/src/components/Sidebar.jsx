import React from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  Users,
  User,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin } = useAuth();
  const { cartItemCount } = useCart();

  const customerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Browse Products', icon: Package },
    { id: 'cart', label: 'My Cart', icon: ShoppingCart, badge: cartItemCount },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : customerNavItems;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-wide">Nexus Control</h1>
            <p className="text-[10px] font-medium text-slate-400">Inventory & Order System</p>
          </div>
        </div>

        {/* User Status Card */}
        {user ? (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-400' : 'bg-cyan-400'}`}></span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <p className="text-xs text-slate-400">Browsing as Guest</p>
          </div>
        )}

        {/* Navigation Section */}
        <div className="px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            {isAdmin ? 'Management Menu' : 'Shopping Menu'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer System Status Indicator */}
      <div className="p-4 border-t border-slate-800 text-center">
        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Operational</span>
        </div>
      </div>
    </aside>
  );
};
