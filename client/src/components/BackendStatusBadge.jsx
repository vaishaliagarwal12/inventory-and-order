import React from 'react';
import { Activity, RefreshCw, CheckCircle2, XCircle, Database, Server } from 'lucide-react';

export const BackendStatusBadge = ({
  loading,
  healthData,
  error,
  responseTimeMs,
  lastChecked,
  onRefresh,
}) => {
  const isConnected = !loading && healthData && healthData.success;
  const dbStatus = healthData?.database?.status;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          {loading ? (
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : isConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Backend Status
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                loading
                  ? 'bg-slate-800 text-slate-300'
                  : isConnected
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
              }`}
            >
              {loading ? 'Checking...' : isConnected ? '● Connected' : '● Disconnected'}
            </span>
          </div>

          <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
            {healthData?.environment && (
              <span className="text-slate-500">Env: {healthData.environment}</span>
            )}

            {responseTimeMs !== null && isConnected && (
              <span className="flex items-center gap-1 text-slate-400">
                <Activity className="w-3 h-3 text-cyan-400" />
                {responseTimeMs}ms latency
              </span>
            )}

            {lastChecked && (
              <span className="text-slate-500">
                Updated: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 justify-between sm:justify-end">
        {/* DB Connection Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <Database className={`w-3.5 h-3.5 ${dbStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-400 font-medium">PostgreSQL:</span>
          <span className={dbStatus === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {loading ? '...' : dbStatus === 'connected' ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};
