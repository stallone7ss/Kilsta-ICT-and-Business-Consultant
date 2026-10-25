import React, { useState, useEffect, useMemo } from 'react';
import {
  Server,
  Layers,
  Search,
  Plus,
  Scan,
  RefreshCw,
  Database,
  Truck,
  Key,
  History,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Grid,
  List,
  CheckCircle2,
  ExternalLink,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Cpu,
  ShieldCheck,
  Building,
  BellRing
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  InventoryItem,
  StockTransaction,
  SoftwareLicense,
  ClientDeployment,
  Supplier,
  SystemSettings,
  DatabaseStats,
  ItemCategory,
  RealtimeMessage
} from './types/inventory.ts';
import { inventoryApi, setupRealtimeSync } from './services/api.ts';
import { AssetModal } from './components/AssetModal.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { ItemDetailModal } from './components/ItemDetailModal.tsx';
import { BarcodeScannerModal } from './components/BarcodeScannerModal.tsx';
import { DatabaseManagerTab } from './components/DatabaseManagerTab.tsx';
import { LicensesTab } from './components/LicensesTab.tsx';
import { DeploymentsTab } from './components/DeploymentsTab.tsx';
import { TransactionsTab } from './components/TransactionsTab.tsx';
import { BarcodeBadge } from './components/BarcodeBadge.tsx';

type TabType = 'inventory' | 'transactions' | 'licenses' | 'deployments' | 'database';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [deployments, setDeployments] = useState<ClientDeployment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time status indicator
  const [isConnected, setIsConnected] = useState(false);
  const [lastLiveEvent, setLastLiveEvent] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'SEK'>('USD');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'valuation' | 'sku'>('name');

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryItem | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionTargetItem, setTransactionTargetItem] = useState<InventoryItem | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string; type: 'info' | 'warning' | 'success' } | null>(null);

  const showToast = (title: string, body: string, type: 'info' | 'warning' | 'success' = 'info') => {
    setToastMessage({ title, body, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial load
  const loadAllData = async () => {
    try {
      const [fetchedItems, fetchedTx, fetchedLic, fetchedDep, fetchedSup, fetchedStats, fetchedSet] =
        await Promise.all([
          inventoryApi.getItems(),
          inventoryApi.getTransactions(),
          inventoryApi.getLicenses(),
          inventoryApi.getDeployments(),
          inventoryApi.getSuppliers(),
          inventoryApi.getStats(),
          inventoryApi.getSettings()
        ]);

      setItems(fetchedItems);
      setTransactions(fetchedTx);
      setLicenses(fetchedLic);
      setDeployments(fetchedDep);
      setSuppliers(fetchedSup);
      setStats(fetchedStats);
      setSettings(fetchedSet);
      if (fetchedSet?.currency) {
        setCurrency(fetchedSet.currency);
      }
    } catch (err) {
      console.error('Failed to load initial inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Hook up real-time SSE listener
    const cleanupSSE = setupRealtimeSync((msg: RealtimeMessage) => {
      setIsConnected(true);
      setLastLiveEvent(new Date().toLocaleTimeString());

      if (msg.type === 'ITEM_CREATED') {
        const newItem = msg.data as InventoryItem;
        setItems(prev => [newItem, ...prev.filter(i => i.id !== newItem.id)]);
        showToast('Real-time: Asset Registered', `${newItem.name} added to inventory database.`, 'success');
        refreshStats();
      } else if (msg.type === 'ITEM_UPDATED') {
        const updated = msg.data as InventoryItem;
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
        if (updated.quantity <= updated.minThreshold) {
          showToast('Low Stock Alert', `${updated.name} has dropped to ${updated.quantity} units!`, 'warning');
        }
        refreshStats();
      } else if (msg.type === 'ITEM_DELETED') {
        const { id, name } = msg.data;
        setItems(prev => prev.filter(i => i.id !== id));
        showToast('Asset Removed', `${name} deleted from catalog.`, 'info');
        refreshStats();
      } else if (msg.type === 'TRANSACTION_RECORDED') {
        const tx = msg.data as StockTransaction;
        setTransactions(prev => [tx, ...prev.slice(0, 99)]);
        refreshStats();
      } else if (msg.type === 'LICENSE_UPDATED' || msg.type === 'DEPLOYMENT_UPDATED') {
        loadAllData();
      } else if (msg.type === 'DB_RESET' || msg.type === 'DB_IMPORTED') {
        loadAllData();
        showToast('Database Reloaded', 'Inventory refreshed from persistent database state.', 'info');
      }
    });

    return () => cleanupSSE();
  }, []);

  const refreshStats = async () => {
    try {
      const newStats = await inventoryApi.getStats();
      setStats(newStats);
    } catch {
      // ignore
    }
  };

  // Currency multiplier helper
  const currencyRate = currency === 'SEK' ? 10.4 : currency === 'EUR' ? 0.92 : 1.0;
  const currencySymbol = currency === 'SEK' ? 'kr' : currency === 'EUR' ? '€' : '$';

  const formatCurrency = (amountInUSD: number) => {
    const val = amountInUSD * currencyRate;
    if (currency === 'SEK') {
      return `${Math.round(val).toLocaleString()} kr`;
    }
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
        if (showLowStockOnly && item.quantity > item.minThreshold) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.barcode.includes(q) ||
            item.serialNumber.toLowerCase().includes(q) ||
            item.brand.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'quantity') return b.quantity - a.quantity;
        if (sortBy === 'valuation') return b.quantity * b.unitCost - a.quantity * a.unitCost;
        if (sortBy === 'sku') return a.sku.localeCompare(b.sku);
        return a.name.localeCompare(b.name);
      });
  }, [items, selectedCategory, showLowStockOnly, searchQuery, sortBy]);

  // Handlers
  const handleSaveAsset = async (itemData: Partial<InventoryItem>) => {
    if (editingItem) {
      await inventoryApi.updateItem(editingItem.id, itemData);
      showToast('Asset Updated', `${itemData.name} saved successfully.`, 'success');
    } else {
      await inventoryApi.createItem(itemData);
      showToast('Asset Created', `${itemData.name} added to database.`, 'success');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
    await loadAllData();
  };

  const handleDeleteAsset = async (id: string) => {
    await inventoryApi.deleteItem(id);
    await loadAllData();
  };

  const handleInlineQuickStock = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      await inventoryApi.processTransaction({
        itemId: item.id,
        type: delta > 0 ? 'STOCK_IN' : 'STOCK_OUT',
        quantity: Math.abs(delta),
        reference: `QUICK-${delta > 0 ? 'IN' : 'OUT'}-${Date.now().toString().slice(-4)}`,
        operator: 'Stallone Yabom',
        notes: `Quick inline inventory bump (${delta > 0 ? '+' : ''}${delta})`
      });
      showToast('Stock Adjusted', `${item.name}: ${item.quantity} → ${newQty} units.`, 'info');
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  const categoriesList: ItemCategory[] = [
    'Networking',
    'Servers & Infrastructure',
    'Workstations & Laptops',
    'Storage & SAN',
    'Cybersecurity & Firewalls',
    'Peripherals & Displays',
    'Cables & Optical',
    'Power & Cooling'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 p-4 bg-slate-900 border border-cyan-500/50 rounded-2xl shadow-2xl animate-bounce duration-300">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
            <BellRing className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">{toastMessage.title}</div>
            <div className="text-xs text-slate-300">{toastMessage.body}</div>
          </div>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Server className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-white uppercase">
                    Kilsta Business ICT
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    REAL-TIME DB
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                    Live SSE Connected
                  </span>
                  <span>•</span>
                  <a
                    href="https://kilsta-business-ict.stalloneyabom65.workers.dev/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-cyan-400 transition-colors flex items-center gap-0.5"
                  >
                    Worker: stalloneyabom65.workers.dev
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions & Scanner Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Scan className="w-4 h-4" />
                <span className="hidden sm:inline">Barcode / Scan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setIsAssetModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">New Asset</span>
              </button>

              {/* Currency Selector */}
              <div className="hidden md:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-mono">
                {(['USD', 'EUR', 'SEK'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`px-2 py-1 rounded-lg font-bold transition-all ${
                      currency === c
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-t border-slate-800/80 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Layers className="w-4 h-4" />
              Inventory Catalog ({items.length})
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <History className="w-4 h-4" />
              Stock Audit Log ({transactions.length})
            </button>

            <button
              onClick={() => setActiveTab('licenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'licenses'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Key className="w-4 h-4" />
              Software & CALs ({licenses.length})
            </button>

            <button
              onClick={() => setActiveTab('deployments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'deployments'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Truck className="w-4 h-4" />
              Client Deployments ({deployments.length})
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Database className="w-4 h-4" />
              Database & Cloudflare Worker Bridge
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Summary Ribbon */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Valuation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">
              <span>Inventory Valuation</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {formatCurrency(stats?.totalValuation || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Across {stats?.totalQuantity || 0} hardware items
            </div>
          </div>

          {/* Cataloged Items */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">
              <span>Cataloged Assets</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black font-mono text-cyan-400">
              {stats?.totalItems || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Hardware SKUs & Parts
            </div>
          </div>

          {/* Low Stock & Warnings */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setShowLowStockOnly(!showLowStockOnly);
            }}
            className={`cursor-pointer rounded-2xl p-4.5 shadow-lg border transition-all ${
              (stats?.lowStockCount || 0) > 0 || (stats?.outOfStockCount || 0) > 0
                ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1 font-semibold uppercase tracking-wider">
              <span>Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-300">
              {(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0)}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1 font-mono">
              {stats?.outOfStockCount || 0} Depleted • {stats?.lowStockCount || 0} Low Stock
            </div>
          </div>

          {/* Active Field Deployments */}
          <div
            onClick={() => setActiveTab('deployments')}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-lg cursor-pointer hover:border-cyan-500/40 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">
              <span>Field Deployments</span>
              <Truck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black font-mono text-indigo-300">
              {stats?.activeDeploymentsCount || 0} Sites
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Active Client Installations
            </div>
          </div>
        </section>

        {/* TAB 1: INVENTORY CATALOG */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Search, Filter & View Controls */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, SKU, serial number, barcode, or location..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sort & View toggles */}
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="quantity">Sort: Stock Quantity</option>
                    <option value="valuation">Sort: Total Valuation</option>
                    <option value="sku">Sort: SKU Code</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      showLowStockOnly
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Low Stock
                  </button>

                  <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Card Grid View"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All Categories ({items.length})
                </button>
                {categoriesList.map(cat => {
                  const count = items.filter(i => i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                        selectedCategory === cat
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-850 font-mono">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View Mode: Table */}
            {viewMode === 'table' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">SKU / Barcode</th>
                        <th className="py-3.5 px-4">Asset Name & Specs</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-center">Stock Level</th>
                        <th className="py-3.5 px-4">Placement</th>
                        <th className="py-3.5 px-4">Valuation</th>
                        <th className="py-3.5 px-4 text-right">Quick Stock / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-500">
                            No assets match the current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map(item => {
                          const isLowStock = item.quantity <= item.minThreshold;
                          const isOutOfStock = item.quantity === 0;
                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                              onClick={() => setSelectedDetailItem(item)}
                            >
                              <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                                <div className="text-cyan-400 font-bold">{item.sku}</div>
                                <div className="text-[10px] text-slate-500">BC: {item.barcode}</div>
                              </td>
                              <td className="py-3.5 px-4 max-w-sm">
                                <div className="font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  {item.brand} • {item.model}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700/80">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span
                                    className={`px-3 py-1 rounded-lg text-sm font-black font-mono ${
                                      isOutOfStock
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                        : isLowStock
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}
                                  >
                                    {item.quantity} units
                                  </span>
                                  {isLowStock && (
                                    <span className="text-[10px] text-amber-400 font-semibold mt-0.5">
                                      Min: {item.minThreshold}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                                <div className="text-white font-medium truncate">{item.location}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  SN: {item.serialNumber || 'N/A'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                                <div className="text-emerald-400 font-bold">
                                  {formatCurrency(item.quantity * item.unitCost)}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  @{formatCurrency(item.unitCost)}/u
                                </div>
                              </td>
                              <td
                                className="py-3.5 px-4 whitespace-nowrap text-right"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Quick - 1 */}
                                  <button
                                    type="button"
                                    onClick={() => handleInlineQuickStock(item, -1)}
                                    title="Quick dispatch -1 unit"
                                    disabled={item.quantity <= 0}
                                    className="w-7 h-7 bg-slate-800 hover:bg-amber-600/30 text-amber-400 border border-slate-700 rounded-lg flex items-center justify-center font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    -1
                                  </button>
                                  {/* Quick + 1 */}
                                  <button
                                    type="button"
                                    onClick={() => handleInlineQuickStock(item, 1)}
                                    title="Quick restock +1 unit"
                                    className="w-7 h-7 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 border border-slate-700 rounded-lg flex items-center justify-center font-bold text-xs transition-colors"
                                  >
                                    +1
                                  </button>
                                  {/* Log Full Transaction */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransactionTargetItem(item);
                                      setIsTransactionModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Move
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* View Mode: Card Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                  const isLowStock = item.quantity <= item.minThreshold;
                  const isOutOfStock = item.quantity === 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedDetailItem(item)}
                      className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                            {item.sku}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOutOfStock
                                ? 'bg-rose-500/20 text-rose-300'
                                : isLowStock
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {isOutOfStock ? '0 in Stock' : `${item.quantity} in Stock`}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug mb-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-400 mb-3">
                          {item.brand} • {item.model}
                        </p>

                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1 mb-3">
                          <div className="flex justify-between text-slate-400">
                            <span>Location:</span>
                            <span className="text-white font-medium truncate max-w-[180px]">{item.location}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Serial Number:</span>
                            <span className="font-mono text-cyan-300">{item.serialNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Valuation:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {formatCurrency(item.quantity * item.unitCost)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="pt-3 border-t border-slate-800 flex items-center justify-between"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="text-[11px] text-slate-500 font-mono">
                          BC: {item.barcode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInlineQuickStock(item, 1)}
                            className="px-2 py-1 bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                          >
                            +1 In
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTransactionTargetItem(item);
                              setIsTransactionModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Move
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRANSACTIONS AUDIT TRAIL */}
        {activeTab === 'transactions' && (
          <TransactionsTab transactions={transactions} />
        )}

        {/* TAB 3: SOFTWARE LICENSES & CALs */}
        {activeTab === 'licenses' && (
          <LicensesTab
            licenses={licenses}
            onSaveLicense={async lic => {
              await inventoryApi.saveLicense(lic);
              await loadAllData();
              showToast('License Saved', `${lic.softwareName} updated.`, 'success');
            }}
            onDeleteLicense={async id => {
              await inventoryApi.deleteLicense(id);
              await loadAllData();
            }}
          />
        )}

        {/* TAB 4: CLIENT FIELD DEPLOYMENTS */}
        {activeTab === 'deployments' && (
          <DeploymentsTab
            deployments={deployments}
            items={items}
            onSaveDeployment={async dep => {
              await inventoryApi.saveDeployment(dep);
              await loadAllData();
              showToast('Deployment Updated', `${dep.clientName} work order saved.`, 'success');
            }}
          />
        )}

        {/* TAB 5: DATABASE & WORKER SYNC MANAGER */}
        {activeTab === 'database' && (
          <DatabaseManagerTab
            stats={stats}
            settings={settings}
            onRefreshStats={refreshStats}
            onSettingsUpdated={newSet => setSettings(newSet)}
            onDatabaseRestored={loadAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 mt-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Kilsta Business ICT • Real-Time Database Management System • v2.0
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Real-time SSE active
            </span>
            <span>Target Worker: kilsta-business-ict.stalloneyabom65.workers.dev</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSave={handleSaveAsset}
        item={editingItem}
        suppliers={suppliers.map(s => s.name)}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        item={transactionTargetItem}
        onSuccess={() => {
          loadAllData();
          showToast('Transaction Logged', 'Inventory balance updated in real-time.', 'success');
        }}
      />

      <ItemDetailModal
        isOpen={!!selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        item={selectedDetailItem}
        transactions={transactions}
        onEdit={item => {
          setSelectedDetailItem(null);
          setEditingItem(item);
          setIsAssetModalOpen(true);
        }}
        onQuickTransaction={item => {
          setSelectedDetailItem(null);
          setTransactionTargetItem(item);
          setIsTransactionModalOpen(true);
        }}
        onDelete={handleDeleteAsset}
      />

      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        items={items}
        onTransactionSuccess={() => loadAllData()}
        onSelectItem={item => setSelectedDetailItem(item)}
      />
    </div>
  );
}
