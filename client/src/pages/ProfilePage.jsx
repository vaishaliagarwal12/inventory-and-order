import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Mail,
  Calendar,
  LogOut,
  CheckCircle2,
  KeyRound,
  ChevronRight,
  Building,
  Truck,
  Lock,
  Bell,
  History,
  Save,
  Check,
  Upload,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMeApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export const ProfilePage = () => {
  const { user, logout, isAdmin } = useAuth();
  const { showSuccess } = useToast();

  const [profileData, setProfileData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+1 (512) 555-0198');
  const [jobTitle, setJobTitle] = useState(isAdmin ? 'System Administrator' : 'Customer Account');

  // Notification Toggles
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(true);
  const [notifyPromotions, setNotifyPromotions] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profileData?.name) {
      const parts = profileData.name.trim().split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [profileData]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getMeApi();
      if (res.data) {
        setProfileData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = (e) => {
    if (e) e.preventDefault();
    showSuccess('Profile settings updated successfully!');
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!profileData) {
    return (
      <div className="p-16 text-center text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl max-w-xl mx-auto shadow-xs">
        No active user session found. Please log in to view account settings.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight flex items-center gap-2.5">
            <User className="w-7 h-7 text-navy" />
            <span>Account Settings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal profile details, notification preferences, and account security.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-dark text-white text-xs font-bold shadow-md shadow-navy/20 transition-all flex items-center gap-2 cursor-pointer"
            type="button"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Tab Strip Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200 no-scrollbar">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'general'
              ? 'bg-white text-navy shadow-sm'
              : 'text-slate-600 hover:text-navy hover:bg-slate-200/50'
          }`}
        >
          <User className="w-4 h-4 text-teal" />
          Personal Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white text-navy shadow-sm'
              : 'text-slate-600 hover:text-navy hover:bg-slate-200/50'
          }`}
        >
          <Lock className="w-4 h-4 text-teal" />
          Security &amp; Privacy
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-white text-navy shadow-sm'
              : 'text-slate-600 hover:text-navy hover:bg-slate-200/50'
          }`}
        >
          <Bell className="w-4 h-4 text-teal" />
          Notifications
        </button>
      </div>

      {/* Main Content Dual-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: User Summary (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Identity Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-xs relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-sky-light text-navy text-2xl font-bold flex items-center justify-center border border-sky/50 shadow-sm">
                  {getInitials(profileData.name)}
                </div>
                <div className="w-4 h-4 rounded-full bg-teal absolute -bottom-1 -right-1 ring-4 ring-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold text-navy truncate">{profileData.name}</h2>
                  <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                </div>
                <span className="text-xs text-slate-500 truncate mt-0.5">{profileData.email}</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isAdmin
                      ? 'bg-sky-light text-navy border-sky/50'
                      : 'bg-beige text-navy border-amber-200/60'
                  }`}>
                    {profileData.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 bg-slate-50 -mx-6 px-6 pb-4 flex flex-col gap-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Role</span>
                <span className="font-bold text-navy">{profileData.role === 'ADMIN' ? 'Administrator' : 'Customer Account'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Member Since</span>
                <span className="font-medium text-slate-800">
                  {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'Jan 2024'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">User ID</span>
                <span className="font-bold text-navy">#{profileData.id}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => showSuccess('Avatar updated successfully')}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-teal" />
                Change Avatar
              </button>
            </div>
          </div>

          {/* Security Overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal" />
                Security Status
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-light text-navy text-xs font-bold border border-sky/50">
                Protected
              </span>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                <span>Password encrypted with bcrypt</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <KeyRound className="w-4 h-4 text-teal shrink-0" />
                <span>JWT Secure Session Token</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Form Fields (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. Personal Information */}
          <form onSubmit={handleSaveChanges} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-light flex items-center justify-center text-navy border border-sky/40">
                  <User className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Personal Information</h3>
                  <p className="text-xs text-slate-500">Update your name, email, and contact details</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-navy text-xs focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-navy text-xs focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Email Address</label>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                </div>
                <input
                  type="email"
                  readOnly
                  value={profileData.email}
                  className="h-10 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-xs focus:outline-none cursor-not-allowed font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-navy text-xs focus:outline-none focus:ring-2 focus:ring-teal focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          </form>

          {/* 2. Notification Preferences */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-light flex items-center justify-center text-navy border border-sky/40">
                  <Bell className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">Notification Preferences</h3>
                  <p className="text-xs text-slate-500">Choose how you'd like to stay updated on orders</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-all">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-teal shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-navy">Order Updates &amp; Shipping Status</span>
                    <span className="text-xs text-slate-500">Receive email alerts when your order status changes</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOrderStatus}
                  onChange={(e) => setNotifyOrderStatus(e.target.checked)}
                  className="w-4 h-4 rounded accent-navy cursor-pointer"
                />
              </label>

              <label className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-all">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-teal shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-navy">Offers &amp; Product Updates</span>
                    <span className="text-xs text-slate-500">Get notified about discounts and new arrivals</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyPromotions}
                  onChange={(e) => setNotifyPromotions(e.target.checked)}
                  className="w-4 h-4 rounded accent-navy cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Form Action Bottom Bar */}
          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <span className="text-xs text-slate-500 font-medium">
              Account ID: <strong className="text-navy">#{profileData.id}</strong>
            </span>
            <button
              onClick={handleSaveChanges}
              className="px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-dark text-white text-xs font-bold shadow-md shadow-navy/20 transition-all flex items-center gap-2 cursor-pointer"
              type="button"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
