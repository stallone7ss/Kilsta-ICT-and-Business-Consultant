import React, { useState } from 'react';
import {
  History,
  Download,
  Filter,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  RefreshCw,
  ClipboardCheck
} from 'lucide-react';
import { StockTransaction, TransactionType } from '../types/inventory.ts';

interface TransactionsTabProps {
  transactions: StockTransaction[];
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(tx => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.itemName.toLowerCase().includes(q) ||
        tx.sku.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q) ||
        tx.operator.toLowerCase().includes(q) ||
        (tx.recipient && tx.recipient.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Type', 'SKU', 'Item Name', 'Quantity', 'Previous Qty', 'New Qty', 'Reference', 'Operator', 'Recipient', 'Location To', 'Notes'];
    const rows = filtered.map(t => [
      `"${t.timestamp}"`,
      `"${t.type}"`,
      `"${t.sku}"`,
      `"${t.itemName.replace(/"/g, '""')}"`,
      t.quantity,
      t.previousQty,
      t.newQty,
      `"${t.reference}"`,
      `"${t.operator}"`,
      `"${t.recipient || ''}"`,
      `"${t.locationTo || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kilsta_inventory_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'STOCK_IN':
        return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
      case 'STOCK_OUT':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'DEPLOYMENT':
        return <Truck className="w-4 h-4 text-cyan-400" />;
      case 'TRANSFER':
        return <RefreshCw className="w-4 h-4 text-indigo-400" />;
      case 'RMA_RETURN':
        return <RefreshCw className="w-4 h-4 text-purple-400" />;
      case 'AUDIT_ADJUSTMENT':
        return <ClipboardCheck className="w-4 h-4 text-rose-400" />;
    }
  };

  const getTypeBadgeClass = (type: TransactionType) => {
    switch (type) {
      case 'STOCK_IN':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'STOCK_OUT':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'DEPLOYMENT':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'TRANSFER':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'RMA_RETURN':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'AUDIT_ADJUSTMENT':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reference #, item, SKU, or technician..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Actions</option>
            <option value="STOCK_IN">Stock In (Receive)</option>
            <option value="STOCK_OUT">Stock Out (Dispatch)</option>
            <option value="DEPLOYMENT">Deployment</option>
            <option value="TRANSFER">Transfer</option>
            <option value="RMA_RETURN">RMA Return</option>
            <option value="AUDIT_ADJUSTMENT">Audit Count</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Asset & SKU</th>
                <th className="py-3 px-4">Delta / Units</th>
                <th className="py-3 px-4">Balance Impact</th>
                <th className="py-3 px-4">Work Order / Ref</th>
                <th className="py-3 px-4">Operator & Dest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    No transactions matched your filter.
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-bold ${getTypeBadgeClass(
                          tx.type
                        )}`}
                      >
                        {getTypeIcon(tx.type)}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white max-w-xs truncate">{tx.itemName}</div>
                      <div className="font-mono text-[11px] text-cyan-400">{tx.sku}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-white">
                        {tx.type === 'STOCK_IN' || tx.type === 'RMA_RETURN'
                          ? `+${tx.quantity}`
                          : tx.type === 'STOCK_OUT' || tx.type === 'DEPLOYMENT'
                          ? `-${tx.quantity}`
                          : `${tx.quantity}`}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">units</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono">
                      <span className="text-slate-500">{tx.previousQty}</span>
                      <span className="mx-1 text-slate-600">→</span>
                      <span className="text-cyan-400 font-bold">{tx.newQty}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-white">{tx.operator}</div>
                      {tx.recipient && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          To: {tx.recipient}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
