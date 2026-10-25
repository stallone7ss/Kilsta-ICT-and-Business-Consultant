import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Truck, RefreshCw, ClipboardCheck, ArrowRight } from 'lucide-react';
import { InventoryItem, TransactionType } from '../types/inventory.ts';
import { inventoryApi } from '../services/api.ts';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess: (updatedItem: InventoryItem) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess
}) => {
  const [type, setType] = useState<TransactionType>('STOCK_IN');
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState('');
  const [operator, setOperator] = useState('Stallone Yabom');
  const [recipient, setRecipient] = useState('');
  const [locationTo, setLocationTo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 && type !== 'AUDIT_ADJUSTMENT') {
      setError('Quantity must be greater than zero');
      return;
    }

    if ((type === 'STOCK_OUT' || type === 'DEPLOYMENT') && quantity > item.quantity) {
      setError(`Cannot dispatch ${quantity} units: Only ${item.quantity} currently in stock.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await inventoryApi.processTransaction({
        itemId: item.id,
        type,
        quantity,
        reference: reference || `TX-${type.substring(0, 3)}-${Date.now().toString().slice(-4)}`,
        operator,
        recipient: recipient || undefined,
        locationTo: locationTo || undefined,
        notes: notes || undefined
      });

      onSuccess(result.item);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetQuantity = () => {
    if (type === 'STOCK_IN' || type === 'RMA_RETURN') return item.quantity + (quantity || 0);
    if (type === 'STOCK_OUT' || type === 'DEPLOYMENT') return Math.max(0, item.quantity - (quantity || 0));
    if (type === 'AUDIT_ADJUSTMENT') return quantity || 0;
    return item.quantity;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Log Real-time Stock Transaction
            </h2>
            <p className="text-xs text-cyan-400 font-mono">
              {item.sku} • {item.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-750 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Operation Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Transaction Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('STOCK_IN')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'STOCK_IN'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                Receive (In)
              </button>

              <button
                type="button"
                onClick={() => setType('STOCK_OUT')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'STOCK_OUT'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                Dispatch (Out)
              </button>

              <button
                type="button"
                onClick={() => setType('DEPLOYMENT')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'DEPLOYMENT'
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                Deploy Site
              </button>

              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'TRANSFER'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                Transfer Bay
              </button>

              <button
                type="button"
                onClick={() => setType('RMA_RETURN')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'RMA_RETURN'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                RMA Return
              </button>

              <button
                type="button"
                onClick={() => setType('AUDIT_ADJUSTMENT')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'AUDIT_ADJUSTMENT'
                    ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-rose-400" />
                Audit Count
              </button>
            </div>
          </div>

          {/* Current vs Target Projection Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400">Current Balance</div>
              <div className="text-lg font-mono font-bold text-white">{item.quantity} units</div>
            </div>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-slate-400">
                {type === 'AUDIT_ADJUSTMENT' ? 'New Physical Count' : 'Projected Balance'}
              </div>
              <div className="text-lg font-mono font-bold text-cyan-400">
                {getTargetQuantity()} units
              </div>
            </div>
          </div>

          {/* Quantity & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                {type === 'AUDIT_ADJUSTMENT' ? 'Counted Units *' : 'Units Qty *'}
              </label>
              <input
                type="number"
                min={type === 'AUDIT_ADJUSTMENT' ? 0 : 1}
                required
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Work Order / Ref #
              </label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="WO-2026-..., PO-..., Ticket#"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Recipient / Client / Site (if Deploy or Transfer) */}
          {(type === 'DEPLOYMENT' || type === 'STOCK_OUT' || type === 'TRANSFER') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Recipient / Client
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="e.g. Karlskoga Central Clinic"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Destination Rack / Site
                </label>
                <input
                  type="text"
                  value={locationTo}
                  onChange={e => setLocationTo(e.target.value)}
                  placeholder="Server Room Rack 4U / Clinic Site"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Operator and Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Technician / Operator
              </label>
              <input
                type="text"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Transaction Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Reason or dispatch notes"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Recording Audit...' : 'Commit Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
