import React from 'react';
import {
  Server,
  Database,
  ArrowRight,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export const DashboardPlaceholder = ({ healthData, loading, error }) => {
  const isConnected = !loading && healthData && healthData.success;
  const dbStatus = healthData?.database?.status;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Phase 1 Architecture Foundation</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Development Environment Operational
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Frontend, Express backend, and PostgreSQL connection modules are configured and connected.
              No business schemas or modules have been initialized yet, adhering strictly to Phase 1 boundaries.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">Stack:</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-xs font-medium border border-slate-700">React</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-xs font-medium border border-slate-700">Vite</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-xs font-medium border border-slate-700">Express</span>
            <span className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-xs font-medium border border-slate-700">PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Architecture Request-Response Flow Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          Request Flow Verification Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {/* Node 1: React Client */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/50 flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 mb-2 border border-cyan-800/40">
              <span className="font-bold text-xs">UI</span>
            </div>
            <span className="text-xs font-semibold text-slate-200">React Client</span>
            <span className="text-[10px] text-slate-400 mt-1">`client/src/services/api.js`</span>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-cyan-500 animate-pulse" />
          </div>

          {/* Node 2: Express Server */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400 mb-2 border border-blue-800/40">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">Express API</span>
            <span className="text-[10px] text-slate-400 mt-1">`GET /api/health`</span>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-cyan-500 animate-pulse" />
          </div>

          {/* Node 3: PostgreSQL */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
            <div className={`h-10 w-10 rounded-lg ${dbStatus === 'connected' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950 text-amber-400 border border-amber-800/40'} flex items-center justify-center mb-2`}>
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">PostgreSQL</span>
            <span className="text-[10px] text-slate-400 mt-1">`src/config/db.js`</span>
          </div>
        </div>
      </div>

      {/* Backend Response Payload Debug Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Payload */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Live Health Payload (`/api/health`)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">JSON API</span>
            </div>

            {loading ? (
              <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-500 font-mono animate-pulse">
                Fetching response from backend...
              </div>
            ) : isConnected ? (
              <pre className="p-4 rounded-xl bg-slate-950 text-xs text-emerald-400 font-mono overflow-x-auto border border-slate-800/80">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 text-xs text-rose-400 font-mono border border-rose-900/40">
                {error || 'Unable to connect to backend server at http://localhost:5000/api/health'}
              </div>
            )}
          </div>
        </div>

        {/* Phase 1 Verification Checklist */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Phase 1 Verification Checklist
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                Strict Boundaries
              </span>
            </div>

            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Separate `client/` and `server/` root directories created</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Express backend running async controllers & routes</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PostgreSQL `pg` pool connection module configured</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>React + Vite + Tailwind CSS shell rendering properly</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>`GET /api/health` communicating with UI status badge</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 italic pt-1 border-t border-slate-800/80">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Business tables deferred to Phase 2 (Products, Orders, Auth, etc.)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
