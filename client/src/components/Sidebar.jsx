import React from 'react';
import {
  Home,
  Package,
  FolderTree,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  Users,
  User,
  ShieldCheck,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isStorefrontPreview,
  onToggleStorefrontPreview
}) => {
  const { user, isAdmin } = useAuth();
  const { cartItemCount } = useCart();

  const customerNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'products', label: 'Shop Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'cart', label: 'My Cart', icon: ShoppingCart, badge: cartItemCount },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'profile', label: 'Account Profile', icon: User },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isShowingAdminNav = isAdmin && !isStorefrontPreview;
  const navItems = isShowingAdminNav ? adminNavItems : customerNavItems;

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-full transition-colors z-10">
      <div>
        {/* User Card */}
        {user ? (
          <div className="m-3 p-2.5 rounded-xl bg-beige border border-slate-200/80 flex items-center space-x-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isAdmin ? 'bg-navy text-white' : 'bg-sky-light text-navy border border-sky/60'
            }`}>
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-navy truncate leading-tight">{user.name}</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
                <span className="text-[10px] font-semibold text-teal capitalize">
                  {user.role} {isStorefrontPreview ? '(Preview)' : ''}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="m-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 font-semibold">Guest Storefront</p>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="px-3 py-2 space-y-1">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isShowingAdminNav ? 'Store Management' : isStorefrontPreview ? 'Storefront (Preview)' : 'Navigation'}
            </p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-navy text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-navy hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-navy' : 'bg-navy text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Mode Switcher Footer */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {isAdmin && (
          <button
            onClick={() => onToggleStorefrontPreview && onToggleStorefrontPreview(!isStorefrontPreview)}
            className={`w-full py-1.5 px-2.5 text-[11px] font-bold rounded-lg transition-all border flex items-center justify-center space-x-1.5 cursor-pointer ${
              isStorefrontPreview
                ? 'bg-navy text-white border-navy hover:bg-navy-dark shadow-xs'
                : 'bg-slate-50 text-teal border-teal/30 hover:bg-slate-100'
            }`}
          >
            {isStorefrontPreview ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Return to Admin Console</span>
              </>
            ) : (
              <>
                <Home className="w-3.5 h-3.5" />
                <span>View Customer Storefront</span>
              </>
            )}
          </button>
        )}
        <p className="text-[10px] text-slate-400 font-semibold text-center">
          {isShowingAdminNav ? 'ShopFlow Admin Ops v2.0' : 'ShopFlow Storefront v2.0'}
        </p>
      </div>
    </aside>
  );
};
