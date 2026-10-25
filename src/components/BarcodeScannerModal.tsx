import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  Camera,
  Layers,
  MapPin,
  Tag
} from 'lucide-react';
import { InventoryItem } from '../types/inventory.ts';
import { inventoryApi } from '../services/api.ts';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onTransactionSuccess: (item: InventoryItem) => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const BarcodeScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onTransactionSuccess,
  onSelectItem
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [operationType, setOperationType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState('');
  const [operator, setOperator] = useState('Stallone Yabom');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setSearchInput('');
      setMatchedItem(null);
      setStatusMessage(null);
      setQuantity(1);
    }
  }, [isOpen]);

  // Handle hardware barcode scanner rapid keystrokes & enter
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in notes/reference inputs
      if (document.activeElement?.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          lookupItem(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // Fast typing characteristic of barcode scanners (< 40ms per char)
        if (diff > 120 && buffer.length > 0) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items]);

  const lookupItem = (code: string) => {
    const q = code.trim().toLowerCase();
    if (!q) return;

    const found = items.find(
      i =>
        i.barcode.toLowerCase() === q ||
        i.sku.toLowerCase() === q ||
        i.serialNumber.toLowerCase() === q ||
        i.name.toLowerCase().includes(q)
    );

    if (found) {
      setMatchedItem(found);
      setStatusMessage({ type: 'success', text: `Item identified: ${found.name}` });
      setReference(operationType === 'STOCK_IN' ? `RESTOCK-${Date.now().toString().slice(-4)}` : `DISPATCH-${Date.now().toString().slice(-4)}`);
    } else {
      setMatchedItem(null);
      setStatusMessage({ type: 'error', text: `No item found matching code or serial: "${code}"` });
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    lookupItem(searchInput);
  };

  const handleExecuteOperation = async () => {
    if (!matchedItem) return;
    if (quantity <= 0) {
      setStatusMessage({ type: 'error', text: 'Quantity must be greater than 0' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inventoryApi.processTransaction({
        itemId: matchedItem.id,
        type: operationType,
        quantity,
        reference: reference || 'SCAN_RAPID_OP',
        operator: operator || 'Kilsta Tech',
        notes: `Quick barcode scan ${operationType} operation.`
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully updated ${matchedItem.name}. New balance: ${res.item.quantity} units.`
      });
      setMatchedItem(res.item);
      onTransactionSuccess(res.item);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: 'Camera access denied or unavailable in this view.' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Quick Barcode & RFID Scanner
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Hardware Laser Ready • Fast Stock-In / Dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 text-sm font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Search Bar & Scanner Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Scan Barcode or Search Asset (SKU / Serial / Barcode)
            </label>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="e.g. 735001230001, KICT-SRV-0101, or Dell"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Lookup
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                title="Toggle Webcam Scanner"
                className={`px-3 py-2.5 border rounded-xl transition-colors flex items-center justify-center ${
                  isCameraActive
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Camera className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              Direct laser scanner ready: point and pull trigger at any time.
            </p>
          </div>

          {/* Optional Camera Preview */}
          {isCameraActive && (
            <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 shadow-[0_0_12px_red] animate-pulse" />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] text-white font-mono">
                Hold barcode in center line
              </div>
            </div>
          )}

          {/* Matched Item Card */}
          {matchedItem ? (
            <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-4.5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                      {matchedItem.sku}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      BARCODE: {matchedItem.barcode}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {matchedItem.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {matchedItem.brand} • {matchedItem.model}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black font-mono text-cyan-400">
                    {matchedItem.quantity}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Current Units
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{matchedItem.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{matchedItem.condition}</span>
                </div>
              </div>

              {/* Quick Operation Selector */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOperationType('STOCK_IN')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      operationType === 'STOCK_IN'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    Stock In (+ Receive)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperationType('STOCK_OUT')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      operationType === 'STOCK_OUT'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4 text-amber-400" />
                    Stock Out (- Dispatch)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={operationType === 'STOCK_OUT' ? matchedItem.quantity : 9999}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Work Order / Ref #
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      placeholder="PO#, WO#, Ticket#"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExecuteOperation}
                    disabled={isSubmitting}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      operationType === 'STOCK_IN'
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-amber-600 hover:bg-amber-500'
                    }`}
                  >
                    {isSubmitting ? (
                      'Processing Transaction...'
                    ) : (
                      <>
                        Confirm {operationType === 'STOCK_IN' ? `+${quantity} Units In` : `-${quantity} Units Out`}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectItem(matchedItem);
                      onClose();
                    }}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center">
              <Scan className="w-10 h-10 text-slate-600 mx-auto mb-2.5 stroke-1" />
              <p className="text-sm font-medium text-slate-300">
                Ready to scan or query asset
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Point your barcode reader or type an asset tag above to quickly verify stock levels, check in shipments, or log dispatches.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
