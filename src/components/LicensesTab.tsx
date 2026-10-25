import React, { useState } from 'react';
import { Key, Plus, Shield, Calendar, Users, AlertCircle, Copy, Check, Trash2, Edit } from 'lucide-react';
import { SoftwareLicense } from '../types/inventory.ts';

interface LicensesTabProps {
  licenses: SoftwareLicense[];
  onSaveLicense: (lic: SoftwareLicense) => Promise<void>;
  onDeleteLicense: (id: string) => Promise<void>;
}

export const LicensesTab: React.FC<LicensesTabProps> = ({
  licenses,
  onSaveLicense,
  onDeleteLicense
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Form State
  const [softwareName, setSoftwareName] = useState('');
  const [vendor, setVendor] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [type, setType] = useState<SoftwareLicense['type']>('Annual Subscription');
  const [totalSeats, setTotalSeats] = useState(10);
  const [allocatedSeats, setAllocatedSeats] = useState(8);
  const [expiryDate, setExpiryDate] = useState('2027-06-30');
  const [costPerYear, setCostPerYear] = useState(1200);
  const [notes, setNotes] = useState('');

  const openNewModal = () => {
    setEditingLicense(null);
    setSoftwareName('');
    setVendor('');
    setLicenseKey(`LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    setType('Annual Subscription');
    setTotalSeats(25);
    setAllocatedSeats(15);
    setExpiryDate('2027-12-31');
    setCostPerYear(2400);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (lic: SoftwareLicense) => {
    setEditingLicense(lic);
    setSoftwareName(lic.softwareName);
    setVendor(lic.vendor);
    setLicenseKey(lic.licenseKey);
    setType(lic.type);
    setTotalSeats(lic.totalSeats);
    setAllocatedSeats(lic.allocatedSeats);
    setExpiryDate(lic.expiryDate);
    setCostPerYear(lic.costPerYear);
    setNotes(lic.notes || '');
    setIsModalOpen(true);
  };

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    let status: 'Active' | 'Expiring Soon' | 'Expired' = 'Active';
    if (diffDays < 0) status = 'Expired';
    else if (diffDays <= 45) status = 'Expiring Soon';

    const licToSave: SoftwareLicense = {
      id: editingLicense ? editingLicense.id : `lic-${Date.now()}`,
      softwareName,
      vendor,
      licenseKey,
      type,
      totalSeats,
      allocatedSeats,
      assignedUsers: editingLicense?.assignedUsers || ['Kilsta IT Operations', 'Executive Fleet'],
      expiryDate,
      costPerYear,
      status,
      notes
    };

    await onSaveLicense(licToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            Software Subscriptions, Keys & CALs
          </h2>
          <p className="text-xs text-slate-400">
            Monitor seat allocations, key compliance, and upcoming renewal deadlines.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewModal}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Software License
        </button>
      </div>

      {/* Licenses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {licenses.map(lic => {
          const seatPct = Math.round((lic.allocatedSeats / Math.max(1, lic.totalSeats)) * 100);
          return (
            <div
              key={lic.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-purple-500/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                    {lic.type}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      lic.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : lic.status === 'Expiring Soon'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {lic.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-0.5">{lic.softwareName}</h3>
                <p className="text-xs text-slate-400 mb-3">{lic.vendor}</p>

                {/* License Key Box */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs mb-4">
                  <span className="text-slate-300 truncate mr-2 select-all font-semibold">
                    {lic.licenseKey}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(lic.id, lic.licenseKey)}
                    className="text-slate-400 hover:text-white p-1 rounded"
                    title="Copy License Key"
                  >
                    {copiedKeyId === lic.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Seat Meter */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" /> Seats Allocated:
                    </span>
                    <span className="font-mono font-bold text-white">
                      {lic.allocatedSeats} / {lic.totalSeats} ({seatPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        seatPct > 90 ? 'bg-rose-500' : seatPct > 75 ? 'bg-amber-400' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, seatPct)}%` }}
                    />
                  </div>
                </div>

                {/* Expiry and Cost */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-800 text-slate-400">
                  <div>
                    <span className="block text-[10px] text-slate-500">Renews On:</span>
                    <span className="font-mono text-white">{lic.expiryDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-500">Annual Cost:</span>
                    <span className="font-mono text-emerald-400 font-bold">${lic.costPerYear}/yr</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => openEditModal(lic)}
                  className="text-slate-400 hover:text-cyan-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit License
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete license ${lic.softwareName}?`)) {
                      onDeleteLicense(lic.id);
                    }
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit License Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">
              {editingLicense ? 'Edit License' : 'Register Software License'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Software Name *</label>
                <input
                  type="text"
                  required
                  value={softwareName}
                  onChange={e => setSoftwareName(e.target.value)}
                  placeholder="e.g. SentinelOne Complete EDR"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={e => setVendor(e.target.value)}
                    placeholder="Microsoft, SentinelOne..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">License Model</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Annual Subscription">Annual Subscription</option>
                    <option value="Perpetual">Perpetual</option>
                    <option value="Monthly Cloud">Monthly Cloud</option>
                    <option value="OEM">OEM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">License Key / Serial *</label>
                <input
                  type="text"
                  required
                  value={licenseKey}
                  onChange={e => setLicenseKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-purple-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Seats</label>
                  <input
                    type="number"
                    min={1}
                    value={totalSeats}
                    onChange={e => setTotalSeats(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Allocated Seats</label>
                  <input
                    type="number"
                    min={0}
                    max={totalSeats}
                    value={allocatedSeats}
                    onChange={e => setAllocatedSeats(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Cost ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={costPerYear}
                    onChange={e => setCostPerYear(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                >
                  Save License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
