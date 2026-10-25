import {
  InventoryItem,
  StockTransaction,
  SoftwareLicense,
  ClientDeployment,
  Supplier,
  SystemSettings,
  DatabaseSnapshot,
  DatabaseStats,
  RealtimeMessage
} from '../types/inventory.ts';

const API_BASE = '/api';

export const inventoryApi = {
  // Database stats
  async getStats(): Promise<DatabaseStats> {
    const res = await fetch(`${API_BASE}/database/stats`);
    if (!res.ok) throw new Error('Failed to fetch database statistics');
    return res.json();
  },

  // Inventory Items
  async getItems(params?: { category?: string; search?: string; lowStock?: boolean }): Promise<InventoryItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.lowStock) query.set('lowStock', 'true');

    const res = await fetch(`${API_BASE}/inventory?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  async getItem(id: string): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Item not found');
    return res.json();
  },

  async createItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create item');
    }
    return res.json();
  },

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const res = await fetch(`${API_BASE}/inventory/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update item');
    }
    return res.json();
  },

  async deleteItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/inventory/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete item');
  },

  // Stock Operations & Transactions
  async processTransaction(data: {
    itemId: string;
    type: 'STOCK_IN' | 'STOCK_OUT' | 'DEPLOYMENT' | 'TRANSFER' | 'RMA_RETURN' | 'AUDIT_ADJUSTMENT';
    quantity: number;
    reference: string;
    operator: string;
    recipient?: string;
    locationFrom?: string;
    locationTo?: string;
    notes?: string;
  }): Promise<{ success: boolean; item: InventoryItem; transaction: StockTransaction }> {
    const res = await fetch(`${API_BASE}/inventory/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Transaction failed');
    }
    return result;
  },

  async getTransactions(limit = 100): Promise<StockTransaction[]> {
    const res = await fetch(`${API_BASE}/transactions?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  // Licenses
  async getLicenses(): Promise<SoftwareLicense[]> {
    const res = await fetch(`${API_BASE}/licenses`);
    if (!res.ok) throw new Error('Failed to fetch licenses');
    return res.json();
  },

  async saveLicense(license: SoftwareLicense): Promise<SoftwareLicense> {
    const isNew = !license.id || license.id.startsWith('new-');
    const url = isNew ? `${API_BASE}/licenses` : `${API_BASE}/licenses/${license.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(license)
    });
    if (!res.ok) throw new Error('Failed to save license');
    return res.json();
  },

  async deleteLicense(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/licenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete license');
  },

  // Deployments
  async getDeployments(): Promise<ClientDeployment[]> {
    const res = await fetch(`${API_BASE}/deployments`);
    if (!res.ok) throw new Error('Failed to fetch deployments');
    return res.json();
  },

  async saveDeployment(dep: ClientDeployment): Promise<ClientDeployment> {
    const isNew = !dep.id || dep.id.startsWith('new-');
    const url = isNew ? `${API_BASE}/deployments` : `${API_BASE}/deployments/${dep.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dep)
    });
    if (!res.ok) throw new Error('Failed to save deployment');
    return res.json();
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const res = await fetch(`${API_BASE}/suppliers`);
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // Database Management
  getExportUrl(): string {
    return `${API_BASE}/database/export`;
  },

  async importDatabase(snapshot: DatabaseSnapshot): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/database/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to restore database');
    }
    return res.json();
  },

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/database/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset database');
    return res.json();
  },

  async executeQuery(query: {
    table: 'items' | 'transactions' | 'licenses' | 'deployments' | 'suppliers';
    filterField?: string;
    filterValue?: string;
    minQuantity?: number;
    maxQuantity?: number;
    limit?: number;
  }) {
    const res = await fetch(`${API_BASE}/database/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!res.ok) throw new Error('Query execution failed');
    return res.json();
  },

  // Worker Sync
  async testWorkerSync(url?: string): Promise<{ success: boolean; status: number; statusText: string; testedAt: string }> {
    const res = await fetch(`${API_BASE}/worker-sync/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },

  async pushToWorker(url?: string): Promise<{ success: boolean; status?: number; itemsPushed: number; pushedAt: string }> {
    const res = await fetch(`${API_BASE}/worker-sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Worker sync push failed');
    }
    return res.json();
  }
};

// Real-time EventSource listener hook / manager
export function setupRealtimeSync(onEvent: (msg: RealtimeMessage) => void) {
  let eventSource: EventSource | null = null;
  let retryTimer: any = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`${API_BASE}/realtime/events`);

      eventSource.onopen = () => {
        // Connected
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onEvent(parsed);
        } catch {
          // ignore heartbeat comments or malformed lines
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          // Reconnect with 3 second delay
          clearTimeout(retryTimer);
          retryTimer = setTimeout(connect, 3000);
        }
      };
    } catch {
      if (!isClosed) {
        retryTimer = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    clearTimeout(retryTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
