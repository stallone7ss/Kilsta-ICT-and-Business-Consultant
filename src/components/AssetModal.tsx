import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Cpu, HardDrive, Shield, Sparkles } from 'lucide-react';
import { InventoryItem, ItemCategory, ItemCondition } from '../types/inventory.ts';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventoryItem>) => Promise<void>;
  item?: InventoryItem | null;
  suppliers: string[];
}

const CATEGORIES: ItemCategory[] = [
  'Networking',
  'Servers & Infrastructure',
  'Workstations & Laptops',
  'Storage & SAN',
  'Cybersecurity & Firewalls',
  'Peripherals & Displays',
  'Cables & Optical',
  'Components & Upgrades',
  'Power & Cooling'
];

const CONDITIONS: ItemCondition[] = [
  'Brand New',
  'Refurbished',
  'Deployed / In Use',
  'Maintenance / RMA',
  'Decommissioned'
];

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item,
  suppliers
}) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    barcode: '',
    category: 'Networking',
    brand: '',
    model: '',
    serialNumber: '',
    quantity: 1,
    minThreshold: 2,
    unitCost: 0,
    sellingPrice: 0,
    location: 'Central Karlskoga Warehouse',
    condition: 'Brand New',
    supplier: suppliers[0] || 'Dell Technologies Nordic',
    notes: '',
    specs: {}
  });

  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    } else {
      const randomCode = Math.floor(735000000000 + Math.random() * 99999999).toString();
      setFormData({
        name: '',
        sku: `KICT-NET-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: randomCode,
        category: 'Networking',
        brand: '',
        model: '',
        serialNumber: `SN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        quantity: 5,
        minThreshold: 2,
        unitCost: 250,
        sellingPrice: 380,
        location: 'Central Karlskoga Warehouse',
        condition: 'Brand New',
        supplier: suppliers[0] || 'Dustin Sweden AB',
        notes: '',
        specs: {}
      });
    }
    setError(null);
  }, [item, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: ItemCategory) => {
    const prefixMap: Record<string, string> = {
      'Networking': 'NET',
      'Servers & Infrastructure': 'SRV',
      'Workstations & Laptops': 'LAP',
      'Storage & SAN': 'STR',
      'Cybersecurity & Firewalls': 'SEC',
      'Peripherals & Displays': 'MON',
      'Cables & Optical': 'OPT',
      'Components & Upgrades': 'CMP',
      'Power & Cooling': 'PWR'
    };
    const code = prefixMap[cat] || 'ICT';
    setFormData(prev => ({
      ...prev,
      category: cat,
      sku: prev.sku && prev.sku.startsWith('KICT-') ? `KICT-${code}-${Math.floor(1000 + Math.random() * 9000)}` : prev.sku
    }));
  };

  const handleAddSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setFormData(prev => ({
      ...prev,
      specs: {
        ...(prev.specs || {}),
        [specKey.trim()]: specVal.trim()
      }
    }));
    setSpecKey('');
    setSpecVal('');
  };

  const handleRemoveSpec = (keyToRemove: string) => {
    setFormData(prev => {
      const nextSpecs = { ...(prev.specs || {}) };
      delete nextSpecs[keyToRemove];
      return { ...prev, specs: nextSpecs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Item name is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              {item ? 'Edit Inventory Asset' : 'Register New ICT Asset'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Kilsta Business ICT Enterprise Database
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Asset Name / Description *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cisco Catalyst 9200L 48-Port PoE+ Switch"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => handleCategoryChange(e.target.value as ItemCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={e => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                SKU / Asset Code
              </label>
              <input
                type="text"
                required
                value={formData.sku || ''}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Barcode Number
              </label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={formData.brand || ''}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Cisco, Dell, HP, Ubiquiti, Lenovo..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Model Number
              </label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. C9200L-48P-4X-E"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Serial Number (S/N)
              </label>
              <input
                type="text"
                value={formData.serialNumber || ''}
                onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Hardware Serial or Service Tag"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Storage Bay / Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Karlskoga Warehouse Rack 4U"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Quantities & Financials */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
              Stock Levels & Financials
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  On-Hand Units
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.quantity ?? 0}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.minThreshold ?? 2}
                  onChange={e => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-amber-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.unitCost ?? 0}
                  onChange={e => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Selling Price ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.sellingPrice ?? 0}
                  onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-emerald-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Technical Specifications (RAM, CPU, Ports, RAID, OS)
            </h3>

            {formData.specs && Object.keys(formData.specs).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {Object.entries(formData.specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <span className="text-slate-400 font-mono font-medium">{k}:</span>
                    <span className="text-slate-200 font-mono truncate ml-2 mr-2">{v}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(k)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spec Key (e.g. RAM, Ports, Power)"
                value={specKey}
                onChange={e => setSpecKey(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Value (e.g. 64GB DDR4 ECC, 48x GbE PoE+)"
                value={specVal}
                onChange={e => setSpecVal(e.target.value)}
                className="flex-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Supplier & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Primary Supplier
              </label>
              <input
                type="text"
                value={formData.supplier || ''}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Dell Technologies, Dustin, Ingram Micro..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Internal Engineering Notes
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="RMA warranty info, batch notes, special instructions"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
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
              disabled={isSaving}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving to Database...' : item ? 'Update Asset' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
