import React from 'react';
import {
  X,
  Edit,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  Tag,
  DollarSign,
  Cpu,
  Truck,
  Hash,
  ShieldCheck,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { InventoryItem, StockTransaction } from '../types/inventory.ts';
import { BarcodeBadge } from './BarcodeBadge.tsx';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  transactions: StockTransaction[];
  onEdit: (item: InventoryItem) => void;
  onQuickTransaction: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  transactions,
  onEdit,
  onQuickTransaction,
  onDelete
}) => {
  if (!isOpen || !item) return null;

  const itemHistory = transactions.filter(t => t.itemId === item.id || t.sku === item.sku);
  const isLowStock = item.quantity <= item.minThreshold;
  const isOutOfStock = item.quantity === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                {item.sku}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-700/80 text-slate-300">
                {item.category}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                  isOutOfStock
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isLowStock
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock Warning' : 'In Stock'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">{item.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {item.brand} • {item.model}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-750 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Quick Status & Barcode Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inventory Snapshot */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Stock Availability
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black font-mono text-cyan-400">
                    {item.quantity}
                  </span>
                  <span className="text-slate-400 text-xs">units available</span>
                </div>
                <div className="text-xs text-slate-400 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Low Stock Threshold:</span>
                    <span className="font-mono text-amber-300">{item.minThreshold} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit Procurement Cost:</span>
                    <span className="font-mono text-white">${item.unitCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Inventory Valuation:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ${(item.quantity * (item.unitCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => onQuickTransaction(item)}
                  className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Log Transaction
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>

            {/* Barcode & Printable Asset Tag */}
            <div className="flex flex-col items-center justify-center bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <BarcodeBadge
                value={item.barcode || item.sku}
                sku={item.sku}
                name={item.name}
                serialNumber={item.serialNumber}
                showPrintBtn={true}
              />
              <span className="text-[11px] text-slate-500 mt-2 text-center">
                Click printer icon to produce thermal sticker asset tag
              </span>
            </div>
          </div>

          {/* Details & Location */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Warehouse Placement & Identifiers
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Location</div>
                  <div className="font-medium text-white">{item.location || 'Not specified'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Hash className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Serial Number (S/N)</div>
                  <div className="font-mono text-cyan-300">{item.serialNumber || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Hardware Condition</div>
                  <div className="font-medium text-white">{item.condition}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Primary Supplier</div>
                  <div className="font-medium text-white">{item.supplier || 'N/A'}</div>
                </div>
              </div>
            </div>

            {item.notes && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="text-slate-500 font-semibold">Notes:</span> {item.notes}
              </div>
            )}
          </div>

          {/* Technical Specs Grid */}
          {item.specs && Object.keys(item.specs).length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Hardware Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(item.specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between"
                  >
                    <span className="text-slate-400 font-medium">{k}:</span>
                    <span className="font-mono text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Stock Movement History */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Audit Trail for this Asset ({itemHistory.length})
              </span>
            </h3>

            {itemHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No movement transactions logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {itemHistory.map(tx => (
                  <div
                    key={tx.id}
                    className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1 rounded font-mono font-bold text-[10px] ${
                          tx.type === 'STOCK_IN' || tx.type === 'RMA_RETURN'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tx.type === 'DEPLOYMENT'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <div>
                        <div className="text-slate-200 font-medium">
                          {tx.quantity} units ({tx.previousQty} → {tx.newQty})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Ref: {tx.reference} • By {tx.operator}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      {new Date(tx.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${item.name} (${item.sku})?`)) {
                onDelete(item.id);
                onClose();
              }
            }}
            className="text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Asset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
