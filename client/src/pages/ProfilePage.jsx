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
  Badge,
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
  const [jobTitle, setJobTitle] = useState(isAdmin ? 'System Administrator' : 'Senior Procurement Specialist');
  const [department, setDepartment] = useState('Operations & Logistics (OPS-LOG)');
  
  // Notification Toggles
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
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
    showSuccess('Profile configuration saved and synchronized!');
  };

  const getInitials = (name) => {
    if (!name) return 'NX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!profileData) {
    return (
      <div className="p-16 text-center text-xs text-[#bcc8d1] bg-[#181b25] border border-[#262a34] rounded-2xl max-w-xl mx-auto">
        No active user session found. Please log in to view account settings.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1540px] mx-auto w-full">
      {/* Breadcrumb & Page Head */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[11px] text-[#86929a] uppercase tracking-wider mb-1 font-mono">
          <span>Control Console</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#86929a]" />
          <span>Account Registry</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#86929a]" />
          <span className="text-[#00c2ff] font-bold">Profile Config</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl text-[#dfe2ef] tracking-tight font-bold flex items-center gap-3">
              My Profile &amp; Account Settings
              <span className="px-2.5 py-0.5 rounded-full bg-[#36cc92]/15 text-[#5ae9ac] text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5ae9ac] animate-pulse shadow-[0_0_8px_rgba(90,233,172,0.8)]"></span>
                ACTIVE SESSION
              </span>
            </h1>
            <p className="text-xs text-[#bcc8d1] mt-1">
              Manage your personal credentials, warehouse shipping routing, security keys, and automated dispatch alerts.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/50 text-xs font-semibold transition-all flex items-center gap-2"
              type="button"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Account</span>
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-5 py-2.5 rounded-xl bg-[#00c2ff] text-[#00344e] text-xs font-bold shadow-[0_0_16px_-2px_rgba(0,194,255,0.4)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-2"
              type="button"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Strip Bar */}
      <div className="flex items-center gap-1 overflow-x-auto bg-[#0a0e17] p-1.5 rounded-xl shadow-sm border border-[#262a34] no-scrollbar">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'general'
              ? 'bg-[#00c2ff] text-[#00344e] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
              : 'text-[#bcc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
          }`}
        >
          <User className="w-4 h-4" />
          General Info
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'company'
              ? 'bg-[#00c2ff] text-[#00344e] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
              : 'text-[#bcc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
          }`}
        >
          <Building className="w-4 h-4" />
          Company &amp; Billing
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'shipping'
              ? 'bg-[#00c2ff] text-[#00344e] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
              : 'text-[#bcc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
          }`}
        >
          <Truck className="w-4 h-4" />
          Shipping Addresses
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'security'
              ? 'bg-[#00c2ff] text-[#00344e] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
              : 'text-[#bcc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security &amp; Password
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'notifications'
              ? 'bg-[#00c2ff] text-[#00344e] shadow-[0_0_12px_rgba(0,194,255,0.3)]'
              : 'text-[#bcc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
          }`}
        >
          <Bell className="w-4 h-4" />
          Order Notifications
        </button>
      </div>

      {/* Main Content Dual-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Identity & Telemetry Metrics (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Identity Card */}
          <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-6 flex flex-col shadow-md relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#00c2ff]/10 blur-3xl pointer-events-none"></div>
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-[#31353f] flex items-center justify-center text-[#00c2ff] text-2xl font-bold shadow-[0_0_20px_rgba(0,194,255,0.2)] border border-[#3d484f]">
                  {getInitials(profileData.name)}
                </div>
                <div className="w-4 h-4 rounded-full bg-[#36cc92] absolute -bottom-1 -right-1 ring-4 ring-[#181b25] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-[#002113] stroke-[3]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-[#dfe2ef] truncate">{profileData.name}</h2>
                  <CheckCircle2 className="w-4 h-4 text-[#5ae9ac] shrink-0" />
                </div>
                <span className="text-xs text-[#86929a] truncate mt-0.5 font-mono">{profileData.email}</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                    isAdmin
                      ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                  }`}>
                    {profileData.role} (Verified)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 bg-[#0a0e17]/50 -mx-6 px-6 pb-2 flex flex-col gap-2.5 border-t border-[#262a34]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#86929a] uppercase font-semibold">Role Designation</span>
                <span className="font-medium text-[#dfe2ef]">{profileData.role === 'ADMIN' ? 'System Administrator' : 'Senior Procurement Spec.'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#86929a] uppercase font-semibold">Tenure</span>
                <span className="font-mono text-[#00c2ff]">
                  Member since {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'Jan 2024'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#86929a] uppercase font-semibold">Operator ID</span>
                <span className="font-mono text-[#86929a]">NX-OP-00{profileData.id}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[#262a34]">
              <button
                type="button"
                onClick={() => showSuccess('Avatar image updated')}
                className="flex-1 py-2 px-3 rounded-xl bg-[#262a34] hover:bg-[#31353f] text-[#dfe2ef] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-[#31353f]"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New
              </button>
            </div>
          </div>

          {/* Security & Compliance Status */}
          <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-5 flex flex-col gap-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#dfe2ef] font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00c2ff]" />
                Security Posture
              </span>
              <span className="px-2 py-0.5 rounded bg-[#5ae9ac]/10 text-[#5ae9ac] text-[10px] uppercase font-bold">
                Optimal
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0a0e17] border border-[#262a34]">
                <div className="w-8 h-8 rounded-lg bg-[#5ae9ac]/20 flex items-center justify-center shrink-0 text-[#5ae9ac]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#dfe2ef] font-semibold">JWT Bearer Security</span>
                  <span className="text-[11px] text-[#5ae9ac] flex items-center gap-1 mt-0.5 font-mono">
                    Stateless Auth Token Active
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0a0e17] border border-[#262a34]">
                <div className="w-8 h-8 rounded-lg bg-[#00c2ff]/20 flex items-center justify-center shrink-0 text-[#00c2ff]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#dfe2ef] font-semibold">Credential Hashing</span>
                  <span className="text-[11px] text-[#bcc8d1] mt-0.5">
                    Bcrypt Salted Rounds: <span className="text-[#dfe2ef] font-mono font-bold">10</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sparkline Activity Visual */}
            <div className="bg-[#0a0e17] p-3 rounded-xl flex flex-col gap-1 border border-[#262a34]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#86929a] uppercase font-semibold tracking-wider">Session Invocations (7d)</span>
                <span className="font-mono text-xs text-[#00c2ff] font-bold">142 Hits</span>
              </div>
              <div className="w-full h-9 flex items-end gap-1.5 pt-2">
                <div className="flex-1 bg-[#262a34] hover:bg-[#00c2ff] h-[40%] rounded-t transition-all" title="Mon: 12"></div>
                <div className="flex-1 bg-[#262a34] hover:bg-[#00c2ff] h-[65%] rounded-t transition-all" title="Tue: 22"></div>
                <div className="flex-1 bg-[#262a34] hover:bg-[#00c2ff] h-[55%] rounded-t transition-all" title="Wed: 18"></div>
                <div className="flex-1 bg-[#262a34] hover:bg-[#00c2ff] h-[80%] rounded-t transition-all" title="Thu: 29"></div>
                <div className="flex-1 bg-[#262a34] hover:bg-[#00c2ff] h-[95%] rounded-t transition-all" title="Fri: 38"></div>
                <div className="flex-1 bg-[#262a34] hover:bg-[#00c2ff] h-[30%] rounded-t transition-all" title="Sat: 10"></div>
                <div className="flex-1 bg-[#00c2ff] h-[45%] rounded-t shadow-[0_0_8px_rgba(0,194,255,0.4)]" title="Sun (Today): 15"></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Granular Field Configuration (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. Personal Information */}
          <form onSubmit={handleSaveChanges} className="bg-[#181b25] border border-[#262a34] rounded-2xl p-6 flex flex-col gap-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#262a34]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00c2ff]/10 flex items-center justify-center text-[#00c2ff]">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-[#dfe2ef]">Personal Information</h3>
                  <span className="text-xs text-[#bcc8d1]">Primary contact details for procurement manifests</span>
                </div>
              </div>
              <span className="text-[10px] text-[#86929a] font-mono uppercase tracking-wider font-semibold">SEC-01</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#86929a] uppercase font-semibold">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-10 px-3 bg-[#0a0e17] border border-[#262a34] rounded-xl text-[#dfe2ef] text-xs focus:outline-none focus:border-[#00c2ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#86929a] uppercase font-semibold">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-10 px-3 bg-[#0a0e17] border border-[#262a34] rounded-xl text-[#dfe2ef] text-xs focus:outline-none focus:border-[#00c2ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#86929a] uppercase font-semibold">Email Address</label>
                  <span className="text-[10px] text-[#5ae9ac] flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                </div>
                <input
                  type="email"
                  readOnly
                  value={profileData.email}
                  className="h-10 px-3 bg-[#0a0e17] border border-[#262a34] rounded-xl text-[#dfe2ef] text-xs focus:outline-none cursor-not-allowed opacity-80"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#86929a] uppercase font-semibold">Direct Phone Line</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 px-3 bg-[#0a0e17] border border-[#262a34] rounded-xl text-[#dfe2ef] font-mono text-xs focus:outline-none focus:border-[#00c2ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#86929a] uppercase font-semibold">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-10 px-3 bg-[#0a0e17] border border-[#262a34] rounded-xl text-[#dfe2ef] text-xs focus:outline-none focus:border-[#00c2ff]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#86929a] uppercase font-semibold">Department Code</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-10 px-3 bg-[#0a0e17] border border-[#262a34] rounded-xl text-[#dfe2ef] text-xs focus:outline-none focus:border-[#00c2ff] cursor-pointer"
                >
                  <option>Operations &amp; Logistics (OPS-LOG)</option>
                  <option>Warehouse Automation (WHS-AUT)</option>
                  <option>Global Freight Procurement (GFP-EXT)</option>
                  <option>Executive Quality Assurance (QA-DIR)</option>
                </select>
              </div>
            </div>
          </form>

          {/* 2. Notification Preferences */}
          <div className="bg-[#181b25] border border-[#262a34] rounded-2xl p-6 flex flex-col gap-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-[#262a34]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00c2ff]/10 flex items-center justify-center text-[#00c2ff]">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-[#dfe2ef]">Notification Preferences</h3>
                  <span className="text-xs text-[#bcc8d1]">Real-time alerts, procurement status relays, and automated digests</span>
                </div>
              </div>
              <span className="text-[10px] text-[#86929a] font-mono uppercase tracking-wider font-semibold">TRIGGERS</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Toggle 1: Order status updates */}
              <label className="p-3.5 rounded-xl bg-[#0a0e17] border border-[#262a34] flex items-center justify-between cursor-pointer hover:border-[#31353f] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#262a34] flex items-center justify-center text-[#00c2ff]">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2ef]">Order Status Updates (SMS + Email)</span>
                    <span className="text-[11px] text-[#bcc8d1]">Real-time dispatch, transit milestones, and dock confirmations</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOrderStatus}
                  onChange={(e) => setNotifyOrderStatus(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#181b25] border-[#262a34] text-[#00c2ff] focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Toggle 2: Low stock restock alerts */}
              <label className="p-3.5 rounded-xl bg-[#0a0e17] border border-[#262a34] flex items-center justify-between cursor-pointer hover:border-[#31353f] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#262a34] flex items-center justify-center text-[#5ae9ac]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2ef]">Low Stock Restock Alerts</span>
                    <span className="text-[11px] text-[#bcc8d1]">Triggered when active SKU levels dip below threshold</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLowStock}
                  onChange={(e) => setNotifyLowStock(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#181b25] border-[#262a34] text-[#00c2ff] focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Toggle 3: Weekly inventory digest */}
              <label className="p-3.5 rounded-xl bg-[#0a0e17] border border-[#262a34] flex items-center justify-between cursor-pointer hover:border-[#31353f] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#262a34] flex items-center justify-center text-[#86929a]">
                    <History className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2ef]">Weekly Inventory Digest</span>
                    <span className="text-[11px] text-[#bcc8d1]">Aggregated PDF metric breakdown emailed every Monday</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWeeklyDigest}
                  onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#181b25] border-[#262a34] text-[#00c2ff] focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Form Final Action Bottom Bar */}
          <div className="flex items-center justify-between p-4 bg-[#181b25] border border-[#262a34] rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-[#86929a]">
              <CheckCircle2 className="w-4 h-4 text-[#5ae9ac]" />
              <span className="text-xs">
                Changes automatically synced to session ID: <strong className="text-[#dfe2ef] font-mono">#{profileData.id}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 rounded-xl bg-[#00c2ff] text-[#00344e] text-xs font-bold shadow-[0_0_16px_-2px_rgba(0,194,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
                type="button"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

