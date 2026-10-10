import React, { useState } from 'react';
import { Search, ShoppingCart, LogOut, User, Shield, LogIn, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { AuthModal } from './AuthModal';

export const Header = ({ onSearchChange, searchValue, setActiveTab }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { cartItemCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center space-x-3 mr-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab && setActiveTab('dashboard')}
            className="flex items-center space-x-2 text-left cursor-pointer group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-black text-sm tracking-tight shadow-xs group-hover:scale-105 transition-transform">
              SF
            </div>
            <span className="font-extrabold text-lg text-navy tracking-tight">
              ShopFlow
            </span>
          </button>
        </div>

        {/* Global Search Field */}
        <div className="flex-1 max-w-lg mx-2 sm:mx-6">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-teal focus:ring-1 focus:ring-teal/30 rounded-lg text-xs text-navy placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Retail Header Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Currency Selector */}
          <div className="flex items-center space-x-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-teal shrink-0" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-xs font-bold text-navy focus:outline-none cursor-pointer pr-1"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          {/* Cart Icon Button with Count Badge */}
          {(!isAdmin || !isAuthenticated) && (
            <button
              onClick={() => setActiveTab && setActiveTab('cart')}
              className="relative p-2 text-navy hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-navy" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-navy text-white shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* Account Control */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-all text-left cursor-pointer"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-navy text-white' : 'bg-sky-light text-navy border border-sky/60'
                }`}>
                  {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 text-navy" />}
                </div>
                <span className="hidden md:inline-block text-xs font-bold text-navy truncate max-w-[100px]">
                  {user.name}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-navy truncate">{user.name}</p>
                    <p className="text-[10px] text-teal font-semibold capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveTab && setActiveTab('profile');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-navy hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-teal" />
                    <span>Account Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer border-t border-slate-100"
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
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-navy hover:bg-navy-dark rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
