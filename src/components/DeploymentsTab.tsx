import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, Clock, MapPin, User, FileText, Plus, ArrowLeftRight } from 'lucide-react';
import { ClientDeployment, InventoryItem } from '../types/inventory.ts';

interface DeploymentsTabProps {
  deployments: ClientDeployment[];
  items: InventoryItem[];
  onSaveDeployment: (dep: ClientDeployment) => Promise<void>;
}

export const DeploymentsTab: React.FC<DeploymentsTabProps> = ({
  deployments,
  items,
  onSaveDeployment
}) => {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState(`WO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [assignedTechnician, setAssignedTechnician] = useState('Stallone Yabom');
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [selectedQty, setSelectedQty] = useState(1);
  const [notes, setNotes] = useState('');

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    const newDep: ClientDeployment = {
      id: `dep-${Date.now()}`,
      clientName,
      contactPerson,
      clientEmail,
      siteLocation,
      workOrderNumber,
      assignedTechnician,
      items: [
        {
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          serialNumber: item.serialNumber,
          qty: selectedQty
        }
      ],
      status: 'Active On-Site',
      deployedDate: new Date().toISOString().split('T')[0],
      notes
    };

    await onSaveDeployment(newDep);
    setIsNewModalOpen(false);
  };

  const handleUpdateStatus = async (dep: ClientDeployment, newStatus: ClientDeployment['status']) => {
    await onSaveDeployment({ ...dep, status: newStatus });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            Active Client Deployments & Field Assets
          </h2>
          <p className="text-xs text-slate-400">
            Track hardware dispatched to client premises, healthcare centers, server racks, and branch offices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Dispatch New Deployment
        </button>
      </div>

      {/* Deployments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deployments.map(dep => (
          <div
            key={dep.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  {dep.workOrderNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    dep.status === 'Active On-Site'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : dep.status === 'Under Maintenance'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {dep.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{dep.clientName}</h3>

              <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{dep.siteLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Contact: {dep.contactPerson} ({dep.clientEmail})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Lead Technician: {dep.assignedTechnician} • Deployed: {dep.deployedDate}</span>
                </div>
              </div>

              {/* Hardware items in this deployment */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 mb-3 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Equipment Assigned ({dep.items.length})
                </span>
                {dep.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-200 truncate mr-2">
                      • {it.itemName} <span className="text-slate-500">({it.sku})</span>
                    </span>
                    <span className="text-cyan-400 font-bold shrink-0">{it.qty}x</span>
                  </div>
                ))}
              </div>

              {dep.notes && (
                <p className="text-xs text-slate-400 italic mb-2">Note: {dep.notes}</p>
              )}
            </div>

            {/* Quick Status toggle footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Change Status:</span>
              <div className="flex gap-1.5">
                {dep.status !== 'Active On-Site' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(dep, 'Active On-Site')}
                    className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold"
                  >
                    Set Active
                  </button>
                )}
                {dep.status !== 'Under Maintenance' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(dep, 'Under Maintenance')}
                    className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold"
                  >
                    Maintenance
                  </button>
                )}
                {dep.status !== 'Returned' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(dep, 'Returned')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-semibold"
                  >
                    Returned
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Deployment Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">
              Dispatch Client Site Deployment
            </h3>
            <form onSubmit={handleCreateDeployment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Client / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Karlskoga Central Clinic"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="Site Manager / IT Lead"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="it@client.se"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Site Physical Address / Location *
                </label>
                <input
                  type="text"
                  required
                  value={siteLocation}
                  onChange={e => setSiteLocation(e.target.value)}
                  placeholder="e.g. Lasarettsvagen 1, Karlskoga"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Order #
                  </label>
                  <input
                    type="text"
                    value={workOrderNumber}
                    onChange={e => setWorkOrderNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lead Technician
                  </label>
                  <input
                    type="text"
                    value={assignedTechnician}
                    onChange={e => setAssignedTechnician(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Equipment to Assign
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={e => setSelectedItemId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.sku} • {it.quantity} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={selectedQty}
                    onChange={e => setSelectedQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deployment Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="SLA terms, rack mounting notes"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
