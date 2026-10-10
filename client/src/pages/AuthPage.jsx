import React, { useState } from 'react';
import { ShoppingBag, LogIn, UserPlus, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthPage = ({ onSuccessRedirect }) => {
  const { login, register } = useAuth();
  const { showSuccess, showError } = useToast();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fillDevUser = (devEmail, devPass) => {
    setEmail(devEmail);
    setPassword(devPass);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isLoginTab && password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        await login(email, password);
        showSuccess('Logged in successfully!');
        if (onSuccessRedirect) onSuccessRedirect();
      } else {
        await register(name, email, password);
        showSuccess('Registration successful! Please log in with your credentials.');
        setIsLoginTab(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
      showError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-slate-50/70 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy text-white shadow-md shadow-navy/20 mb-2">
            <ShoppingBag className="w-8 h-8 text-sky-light" />
          </div>
          <h2 className="text-2xl font-black text-navy tracking-tight">
            {isLoginTab ? 'Welcome Back to ShopFlow' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-500">
            {isLoginTab ? 'Sign in to access your orders, cart, and account settings' : 'Join ShopFlow to enjoy seamless shopping and express delivery'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              isLoginTab ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
            }`}
          >
            <LogIn className="w-4 h-4 text-teal" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              !isLoginTab ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'
            }`}
          >
            <UserPlus className="w-4 h-4 text-teal" />
            <span>Register</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center space-x-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
            />
          </div>

          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-navy mb-1">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-xs font-bold rounded-xl text-white bg-navy hover:bg-navy-dark transition-all shadow-md shadow-navy/20 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            <span>{isLoginTab ? 'Sign In to Account' : 'Create Customer Account'}</span>
          </button>
        </form>

        {/* Quick Dev Preset Sign-In Buttons */}
        {isLoginTab && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick Demo Sign-In
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDevUser('admin@inventory.com', 'Password123')}
                className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-navy text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal" />
                  <span>Admin User</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">admin@inventory.com</p>
              </button>
              <button
                type="button"
                onClick={() => fillDevUser('alice@example.com', 'Password123')}
                className="p-2.5 text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-navy text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                  <span>Customer Alice</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">alice@example.com</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
