import React from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Home, Package, FolderTree, ShoppingCart, User, ShoppingBag } from 'lucide-react';

export const MainLayout = ({
  activeTab,
  setActiveTab,
  searchValue,
  setSearchValue,
  isStorefrontPreview,
  onToggleStorefrontPreview,
  children
}) => {
  const { isAdmin, isAuthenticated } = useAuth();
  const { cartItemCount } = useCart();
  const showSidebar = isAdmin && !isStorefrontPreview;
  const isCustomerStorefront = !showSidebar;

  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'products', label: 'Shop', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartItemCount },
    { id: isAuthenticated ? 'orders' : 'profile', label: isAuthenticated ? 'Orders' : 'Account', icon: isAuthenticated ? ShoppingBag : User },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-navy overflow-hidden font-sans transition-colors duration-200">
      {/* Admin Sidebar (Only for Admin when not in storefront preview) */}
      {showSidebar && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isStorefrontPreview={isStorefrontPreview}
          onToggleStorefrontPreview={onToggleStorefrontPreview}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Header
          activeTab={activeTab}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          setActiveTab={setActiveTab}
          isStorefrontPreview={isStorefrontPreview}
          onToggleStorefrontPreview={onToggleStorefrontPreview}
          showSidebar={showSidebar}
        />

        {/* Scrollable Main Area */}
        <main className={`flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 bg-slate-50/70 transition-colors duration-200 ${
          isCustomerStorefront ? 'pb-20 md:pb-6' : 'pb-6'
        }`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Indian E-Commerce App Experience) */}
        {isCustomerStorefront && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around z-40 shadow-lg">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center p-1 relative rounded-xl transition-all cursor-pointer min-w-[56px] ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-black' : 'font-semibold'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};
