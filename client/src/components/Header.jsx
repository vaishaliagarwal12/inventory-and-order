import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  LogOut,
  User,
  Shield,
  LogIn,
  Globe,
  Menu,
  X,
  Home,
  Package,
  FolderTree,
  ShoppingBag,
  MapPin,
  Zap,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { CurrencyPrice } from './CurrencyPrice';
import { AuthModal } from './AuthModal';

export const Header = ({
  activeTab,
  onSearchChange,
  searchValue,
  setActiveTab,
  isStorefrontPreview,
  onToggleStorefrontPreview,
  showSidebar
}) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { cartItemCount, cartTotal } = useCart();
  const { currency, setCurrency } = useCurrency();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showCartIcon = !isAdmin || isStorefrontPreview || !isAuthenticated;
  const isCustomerStorefront = !showSidebar;

  const navLinks = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'products', label: 'All Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    ...(isAuthenticated ? [{ id: 'orders', label: 'My Orders', icon: ShoppingBag }] : []),
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (setActiveTab && activeTab !== 'products') {
      setActiveTab('products');
    }
  };

  return (
    <>
      <header className="sticky top-0 bg-white border-b border-slate-200/90 z-30 transition-all shadow-xs">
        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand & Delivery Location Info */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger */}
            {isCustomerStorefront && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-slate-600 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* ShopFlow Logo (Flipkart/Blinkit Retail Identity) */}
            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-sm tracking-tight shadow-xs group-hover:scale-105 transition-transform">
                SF
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-black text-lg text-navy tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                    ShopFlow
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-500 italic">
                    plus
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                  {isAdmin && !isStorefrontPreview ? 'Admin Operations' : 'Instant Storefront'}
                </span>
              </div>
            </button>

            {/* Live Catalog / Warehouse Status Badge (Desktop) */}
            {isCustomerStorefront && (
              <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200 text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-navy uppercase tracking-tight">
                    Live Catalog
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Real-Time Inventory
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Central Search Bar (Flipkart / Blinkit Style) */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl mx-auto relative min-w-0"
          >
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Search products in electronics, fashion, essentials..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs text-navy placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange && onSearchChange('')}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Navigation Links */}
            {isCustomerStorefront && (
              <nav className="hidden xl:flex items-center gap-1 mr-1">
                {navLinks.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-100 text-emerald-800'
                          : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Currency Selector (Preserved) */}
            <div className="flex items-center gap-1 text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-teal shrink-0" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-xs font-bold text-navy focus:outline-none cursor-pointer pr-0.5"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            {/* Blinkit-Style Prominent Cart Button */}
            {showCartIcon && (
              <button
                onClick={() => setActiveTab && setActiveTab('cart')}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                  cartItemCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-navy border border-slate-200'
                }`}
                title="View Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-black">
                    {cartItemCount > 0 ? `${cartItemCount} items` : 'My Cart'}
                  </span>
                  {cartItemCount > 0 && (
                    <span className="text-[9px] font-bold opacity-90">
                      <CurrencyPrice amount={cartTotal} />
                    </span>
                  )}
                </div>
              </button>
            )}

            {/* Account / Sign In */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-all text-left cursor-pointer border border-transparent hover:border-slate-200"
                  aria-expanded={showUserMenu}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    isAdmin ? 'bg-navy text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold text-navy truncate max-w-[90px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline-block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 animate-fadeIn">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-navy truncate">{user.name}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold capitalize">
                        {user.role} {isStorefrontPreview ? '(Preview)' : ''}
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onToggleStorefrontPreview && onToggleStorefrontPreview(!isStorefrontPreview);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-b border-slate-100"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{isStorefrontPreview ? 'Return to Admin Console' : 'View Customer Storefront'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab && setActiveTab('orders');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-teal" />
                      <span>My Orders</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab && setActiveTab('profile');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-navy hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-teal" />
                      <span>Account Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-navy hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isCustomerStorefront && mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-lg z-20 space-y-1 animate-fadeIn"
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-navy hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
