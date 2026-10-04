import React, { useState } from 'react';
import { Search, ShoppingCart, LogOut, User, Shield, LogIn, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { ThemeSelector } from './ThemeSelector';
import { AuthModal } from './AuthModal';

export const Header = ({ onSearchChange, searchValue, setActiveTab }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { cartItemCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="h-16 bg-[#181b25]/90 backdrop-blur-md border-b border-[#262a34] px-6 flex items-center justify-between shrink-0 z-10 transition-colors">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search products, orders, categories..."
              className="w-full pl-10 pr-4 py-2 bg-[#0a0e17] border border-[#262a34] rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00c2ff]/50 focus:ring-1 focus:ring-[#00c2ff]/30 transition-all"
            />
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Theme Selector */}
          <ThemeSelector />

          {/* Currency Selector */}
          <div className="flex items-center space-x-1.5 bg-[#0a0e17] border border-[#262a34] rounded-xl px-2.5 py-1.5 text-xs shadow-inner">
            <Globe className="w-3.5 h-3.5 text-[#00c2ff] shrink-0" />
            <span className="text-[10px] font-semibold text-slate-400 hidden lg:inline uppercase">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer py-0.5"
            >
              <option value="USD" className="bg-[#181b25] text-slate-200">🇺🇸 USD ($)</option>
              <option value="INR" className="bg-[#181b25] text-slate-200">🇮🇳 INR (₹)</option>
            </select>
          </div>

          {/* Cart Icon (For Customer or when items present) */}
          {(!isAdmin || !isAuthenticated) && (
            <button
              onClick={() => setActiveTab && setActiveTab('cart')}
              className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition-all"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 shadow-md animate-scaleIn">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile & Auth Controls */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-700/50 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};
