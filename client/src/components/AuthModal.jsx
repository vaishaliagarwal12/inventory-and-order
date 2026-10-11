import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, LogIn, UserPlus, X, AlertCircle } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLoginTab) {
        await login(email, password);
        onClose();
      } else {
        await register(name, email, password);
        setSuccessMsg('Registration successful! Please log in.');
        setIsLoginTab(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickUser = (quickEmail, quickPass) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsLoginTab(true);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-teal" />
            <span>{isLoginTab ? 'Sign In to Account' : 'Create New Account'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1">
          <button
            onClick={() => {
              setIsLoginTab(true);
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
              isLoginTab
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-500 hover:text-navy'
            }`}
          >
            <LogIn className="w-4 h-4 text-teal" />
            <span>Login</span>
          </button>
          <button
            onClick={() => {
              setIsLoginTab(false);
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all ${
              !isLoginTab
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-500 hover:text-navy'
            }`}
          >
            <UserPlus className="w-4 h-4 text-teal" />
            <span>Register</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              {successMsg}
            </div>
          )}

          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-navy hover:bg-navy-dark text-white font-bold text-xs rounded-xl shadow-md shadow-navy/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isLoginTab ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Quick Dev Login Presets */}
        <div className="px-6 pb-6 border-t border-slate-100 pt-4 bg-slate-50/50">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Demo Quick Sign-In:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillQuickUser('admin@inventory.com', 'Password123')}
              className="flex-1 text-xs py-2 px-3 bg-white hover:bg-slate-100 text-navy font-bold border border-slate-200 rounded-xl text-center shadow-xs cursor-pointer"
            >
              Fill Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickUser('alice@example.com', 'Password123')}
              className="flex-1 text-xs py-2 px-3 bg-white hover:bg-slate-100 text-navy font-bold border border-slate-200 rounded-xl text-center shadow-xs cursor-pointer"
            >
              Fill Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

