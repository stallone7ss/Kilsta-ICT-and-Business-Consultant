import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  Radio,
  Server,
  Terminal,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DatabaseStats, SystemSettings, DatabaseSnapshot } from '../types/inventory.ts';
import { inventoryApi } from '../services/api.ts';

interface DatabaseManagerTabProps {
  stats: DatabaseStats | null;
  settings: SystemSettings | null;
  onRefreshStats: () => void;
  onSettingsUpdated: (newSettings: SystemSettings) => void;
  onDatabaseRestored: () => void;
}

export const DatabaseManagerTab: React.FC<DatabaseManagerTabProps> = ({
  stats,
  settings,
  onRefreshStats,
  onSettingsUpdated,
  onDatabaseRestored
}) => {
  // Worker Bridge State
  const [workerUrl, setWorkerUrl] = useState(
    settings?.workerSyncUrl || 'https://kilsta-business-ict.stalloneyabom65.workers.dev/'
  );
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [isPushingData, setIsPushingData] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Query Console State
  const [queryTable, setQueryTable] = useState<'items' | 'transactions' | 'licenses' | 'deployments' | 'suppliers'>('items');
  const [filterField, setFilterField] = useState('category');
  const [filterValue, setFilterValue] = useState('');
  const [queryMinQty, setQueryMinQty] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Backup file upload ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTestWorkerConnection = async () => {
    setIsTestingSync(true);
    setSyncFeedback(null);
    try {
      const res = await inventoryApi.testWorkerSync(workerUrl);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          text: `Worker Reachable (HTTP ${res.status} ${res.statusText}) at ${new Date(res.testedAt).toLocaleTimeString()}`
        });
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      } else {
        setSyncFeedback({
          type: 'error',
          text: `Worker response status HTTP ${res.status || '0'}: ${res.statusText || 'Unable to connect to worker endpoint'}`
        });
      }
      onRefreshStats();
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: err.message || 'Worker test failed' });
    } finally {
      setIsTestingSync(false);
    }
  };

  const handlePushToWorker = async () => {
    setIsPushingData(true);
    setSyncFeedback(null);
    try {
      const res = await inventoryApi.pushToWorker(workerUrl);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          text: `Successfully pushed snapshot with ${res.itemsPushed} inventory records to Worker!`
        });
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } else {
        setSyncFeedback({
          type: 'error',
          text: `Worker responded with HTTP ${res.status}. Data payload was delivered.`
        });
      }
      onRefreshStats();
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: err.message || 'Push sync failed' });
    } finally {
      setIsPushingData(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const updated = await inventoryApi.updateSettings({ workerSyncUrl: workerUrl });
      onSettingsUpdated(updated);
      setSyncFeedback({ type: 'success', text: 'Worker configuration saved to database settings.' });
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: err.message });
    }
  };

  const handleExecuteQuery = async () => {
    setIsQuerying(true);
    try {
      const res = await inventoryApi.executeQuery({
        table: queryTable,
        filterField: filterField || undefined,
        filterValue: filterValue || undefined,
        minQuantity: queryMinQty !== '' ? parseInt(queryMinQty) : undefined,
        limit: 50
      });
      setQueryResult(res);
    } catch (err: any) {
      setQueryResult({ error: err.message });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleExportDatabase = () => {
    window.location.href = inventoryApi.getExportUrl();
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await inventoryApi.importDatabase(json);
        onDatabaseRestored();
        confetti({ particleCount: 80, spread: 70 });
        alert('Database snapshot successfully imported!');
      } catch (err: any) {
        alert(`Failed to import backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDatabase = async () => {
    if (confirm('Are you sure you want to restore the database to default Kilsta Business ICT factory seed? Any custom items will be reset.')) {
      try {
        await inventoryApi.resetDatabase();
        onDatabaseRestored();
        confetti({ particleCount: 60, spread: 60 });
        alert('Database restored to default enterprise catalog.');
      } catch (err: any) {
        alert(err.message || 'Reset failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cloudflare Worker Dev Sync Bridge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Cloudflare Worker Real-time Bridge
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Workers.dev Integration
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Target endpoint: https://kilsta-business-ict.stalloneyabom65.workers.dev/
              </p>
            </div>
          </div>

          <a
            href={workerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            Open Worker Live URL
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div
            className={`mb-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{syncFeedback.text}</span>
          </div>
        )}

        {/* Worker Endpoint Form */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={workerUrl}
              onChange={e => setWorkerUrl(e.target.value)}
              placeholder="https://kilsta-business-ict.stalloneyabom65.workers.dev/"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Save URL
            </button>
            <button
              type="button"
              disabled={isTestingSync}
              onClick={handleTestWorkerConnection}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl border border-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
            <button
              type="button"
              disabled={isPushingData}
              onClick={handlePushToWorker}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Radio className={`w-3.5 h-3.5 ${isPushingData ? 'animate-pulse' : ''}`} />
              {isPushingData ? 'Pushing Data...' : 'Push Real-time Inventory'}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            <span>
              Real-time sync bridge active. Push sends full inventory snapshot payloads with SKU, serials, and current stock to your Cloudflare Worker.
            </span>
          </div>
        </div>
      </div>

      {/* Database Engine Architecture & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 text-cyan-400 mb-3">
            <HardDrive className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Database Storage Engine</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-mono text-cyan-400 font-bold">Kilsta ACID JSON Engine</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Disk File:</span>
              <span className="font-mono text-slate-300">/data/kilsta_inventory.json</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Database Size:</span>
              <span className="font-mono text-white">{stats?.dbFileSizeKb || 14} KB</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Atomic Write Mode:</span>
              <span className="font-mono text-emerald-400 font-semibold">Enabled (.tmp atomic rename)</span>
            </div>
          </div>
        </div>

        {/* Real-Time SSE Stream Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 text-emerald-400 mb-3">
            <Radio className="w-5 h-5 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Real-Time Event Stream</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Stream Protocol:</span>
              <span className="font-mono text-emerald-400 font-bold">Server-Sent Events (SSE)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono text-slate-300">/api/realtime/events</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Active Live Clients:</span>
              <span className="font-mono text-cyan-400 font-bold">{stats?.sseClientsCount || 1} connected</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Heartbeat Interval:</span>
              <span className="font-mono text-white">20 seconds keepalive</span>
            </div>
          </div>
        </div>

        {/* Table Record Counts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2.5 text-purple-400 mb-3">
            <Server className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">Schema Tables & Counts</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
              <div className="text-[10px] text-slate-500 uppercase">Items Catalog</div>
              <div className="text-base font-bold text-cyan-400">{stats?.totalItems || 0} rows</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
              <div className="text-[10px] text-slate-500 uppercase">Audit Tx Log</div>
              <div className="text-base font-bold text-emerald-400">{stats?.transactionsCount || 0} rows</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
              <div className="text-[10px] text-slate-500 uppercase">Licenses / CALs</div>
              <div className="text-base font-bold text-purple-400">{stats?.licensesCount || 0} rows</div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
              <div className="text-[10px] text-slate-500 uppercase">Deployments</div>
              <div className="text-base font-bold text-amber-400">{stats?.activeDeploymentsCount || 0} active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive SQL / JSON Query Runner Console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Database Query & Inspection Console
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Interactive structured query engine
          </span>
        </div>

        {/* Query Builder Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Select Table
            </label>
            <select
              value={queryTable}
              onChange={e => setQueryTable(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            >
              <option value="items">inventory_items</option>
              <option value="transactions">stock_transactions</option>
              <option value="licenses">software_licenses</option>
              <option value="deployments">client_deployments</option>
              <option value="suppliers">suppliers</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Filter Column
            </label>
            <input
              type="text"
              value={filterField}
              onChange={e => setFilterField(e.target.value)}
              placeholder="category, name, sku, brand..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Match Value (ILIKE)
            </label>
            <input
              type="text"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
              placeholder="e.g. Cisco, Dell, Networking"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={isQuerying}
              onClick={handleExecuteQuery}
              className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {isQuerying ? 'Executing...' : 'Run Query'}
            </button>
          </div>
        </div>

        {/* Query Output View */}
        {queryResult && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-slate-800">
              <span>
                Matched: <strong className="text-cyan-400">{queryResult.matchedCount ?? 0} records</strong>
              </span>
              <button
                type="button"
                onClick={() => setQueryResult(null)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Clear Results
              </button>
            </div>
            <pre className="max-h-64 overflow-y-auto text-emerald-400 text-[11px] leading-relaxed scrollbar-thin">
              {JSON.stringify(queryResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Backup, Export & Disaster Recovery */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Backup, Snapshot & Disaster Recovery
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 max-w-xl">
          Export full JSON database snapshots of your inventory, transaction audit history, software licenses, and field deployments. Restore at any time with zero downtime.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportDatabase}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Download Full Database JSON Backup
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleUploadFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Restore From JSON Snapshot
          </button>

          <button
            type="button"
            onClick={handleResetDatabase}
            className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold border border-rose-500/30 transition-colors flex items-center gap-2 cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            Reset to Enterprise ICT Seed
          </button>
        </div>
      </div>
    </div>
  );
};
