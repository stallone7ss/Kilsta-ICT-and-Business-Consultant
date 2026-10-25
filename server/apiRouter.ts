import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import { RealtimeMessage } from '../src/types/inventory.ts';

export const apiRouter = Router();

// Middleware to parse JSON
apiRouter.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // If body already parsed by express.json(), continue
    if (req.body) return next();
  }
  next();
});

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Kilsta Business ICT Real-Time Inventory Database Engine',
    version: '2.0.0'
  });
});

// Real-time Server-Sent Events (SSE) Stream
apiRouter.get('/realtime/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connected greeting
  const initMsg: RealtimeMessage = {
    type: 'INIT',
    timestamp: new Date().toISOString(),
    data: {
      message: 'Connected to Kilsta Real-time Inventory Stream',
      stats: db.getStats()
    }
  };
  res.write(`data: ${JSON.stringify(initMsg)}\n\n`);

  // Unregister callback on client close
  const unregister = db.registerSSEClient((msg: RealtimeMessage) => {
    try {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    } catch {
      // client disconnected
    }
  });

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregister();
  });
});

// Database Statistics
apiRouter.get('/database/stats', (req: Request, res: Response) => {
  res.json(db.getStats());
});

// Inventory Items
apiRouter.get('/inventory', (req: Request, res: Response) => {
  const { category, search, lowStock } = req.query;
  let items = db.getItems();

  if (category && category !== 'All') {
    items = items.filter(i => i.category === category);
  }

  if (lowStock === 'true') {
    items = items.filter(i => i.quantity <= i.minThreshold);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      i.barcode.includes(q) ||
      i.serialNumber.toLowerCase().includes(q) ||
      i.model.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q)
    );
  }

  res.json(items);
});

apiRouter.get('/inventory/:id', (req: Request, res: Response) => {
  const item = db.getItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found in Kilsta inventory database' });
  }
  res.json(item);
});

apiRouter.post('/inventory', (req: Request, res: Response) => {
  try {
    const newItem = db.addItem(req.body);
    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create item' });
  }
});

apiRouter.put('/inventory/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update item' });
  }
});

apiRouter.delete('/inventory/:id', (req: Request, res: Response) => {
  const deleted = db.deleteItem(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json({ success: true, id: req.params.id });
});

// Stock Operations & Transactions
apiRouter.post('/inventory/transaction', (req: Request, res: Response) => {
  const { itemId, type, quantity, reference, operator, recipient, locationFrom, locationTo, notes } = req.body;
  if (!itemId || !type || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required transaction fields: itemId, type, quantity' });
  }

  const result = db.processStockOperation({
    itemId,
    type,
    quantity: Number(quantity),
    reference: reference || 'TX-MANUAL',
    operator: operator || 'Stallone Yabom',
    recipient,
    locationFrom,
    locationTo,
    notes
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

apiRouter.get('/transactions', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  res.json(db.getTransactions(limit));
});

// Software Licenses
apiRouter.get('/licenses', (req: Request, res: Response) => {
  res.json(db.getLicenses());
});

apiRouter.post('/licenses', (req: Request, res: Response) => {
  try {
    const lic = req.body;
    if (!lic.id) {
      lic.id = `lic-${Date.now().toString(36)}`;
    }
    const saved = db.saveLicense(lic);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/licenses/:id', (req: Request, res: Response) => {
  try {
    const lic = { ...req.body, id: req.params.id };
    const saved = db.saveLicense(lic);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/licenses/:id', (req: Request, res: Response) => {
  const ok = db.deleteLicense(req.params.id);
  if (!ok) return res.status(404).json({ error: 'License not found' });
  res.json({ success: true });
});

// Client Deployments
apiRouter.get('/deployments', (req: Request, res: Response) => {
  res.json(db.getDeployments());
});

apiRouter.post('/deployments', (req: Request, res: Response) => {
  try {
    const dep = req.body;
    if (!dep.id) {
      dep.id = `dep-${Date.now().toString(36)}`;
    }
    const saved = db.saveDeployment(dep);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/deployments/:id', (req: Request, res: Response) => {
  try {
    const dep = { ...req.body, id: req.params.id };
    const saved = db.saveDeployment(dep);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Suppliers
apiRouter.get('/suppliers', (req: Request, res: Response) => {
  res.json(db.getSuppliers());
});

// System Settings
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json(db.getSettings());
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  res.json(db.updateSettings(req.body));
});

// Database Export & Import
apiRouter.get('/database/export', (req: Request, res: Response) => {
  const snapshot = db.getFullSnapshot();
  res.setHeader('Content-Disposition', `attachment; filename="kilsta_inventory_db_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(snapshot, null, 2));
});

apiRouter.post('/database/import', (req: Request, res: Response) => {
  try {
    const snapshot = req.body;
    db.restoreSnapshot(snapshot);
    res.json({ success: true, message: 'Database successfully restored from backup snapshot.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid snapshot file.' });
  }
});

apiRouter.post('/database/reset', (req: Request, res: Response) => {
  const fresh = db.resetDatabase();
  res.json({ success: true, message: 'Database reset to default Kilsta Business ICT seed catalog.', snapshot: fresh });
});

// Interactive SQL/JSON Query Runner
apiRouter.post('/database/query', (req: Request, res: Response) => {
  try {
    const query = req.body;
    const result = db.executeCustomQuery(query);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Query failed' });
  }
});

// Cloudflare Worker Bridge (`https://kilsta-business-ict.stalloneyabom65.workers.dev/`)
apiRouter.post('/worker-sync/test', async (req: Request, res: Response) => {
  const targetUrl = req.body.url || db.getSettings().workerSyncUrl;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kilsta-Inventory-Realtime-DB/2.0'
      }
    }).catch(err => {
      return { ok: false, status: 0, statusText: err.message } as any;
    });

    clearTimeout(timeout);

    const isReachable = response.status >= 200 && response.status < 400;
    const statusText = response.statusText || (isReachable ? 'OK' : 'Unreachable or Network Restrained');

    db.updateSettings({
      lastWorkerSync: new Date().toISOString(),
      lastWorkerSyncStatus: isReachable ? 'success' : 'failed',
      lastWorkerSyncMessage: `HTTP ${response.status}: ${statusText}`
    });

    res.json({
      success: isReachable,
      status: response.status,
      statusText,
      targetUrl,
      testedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message || 'Connection failed',
      targetUrl,
      testedAt: new Date().toISOString()
    });
  }
});

apiRouter.post('/worker-sync/push', async (req: Request, res: Response) => {
  const targetUrl = req.body.url || db.getSettings().workerSyncUrl;
  const snapshot = db.getFullSnapshot();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Kilsta-Inventory-Realtime-DB/2.0',
        'X-Kilsta-Source': 'Realtime-Asset-Engine'
      },
      body: JSON.stringify({
        source: 'Kilsta Business ICT Real-time Inventory System',
        timestamp: new Date().toISOString(),
        itemsCount: snapshot.items.length,
        items: snapshot.items
      }),
      signal: controller.signal
    }).catch(err => {
      return { ok: false, status: 0, statusText: err.message } as any;
    });

    clearTimeout(timeout);

    const success = response.status >= 200 && response.status < 300;

    db.updateSettings({
      lastWorkerSync: new Date().toISOString(),
      lastWorkerSyncStatus: success ? 'success' : 'failed',
      lastWorkerSyncMessage: success
        ? `Successfully synchronized ${snapshot.items.length} inventory records to Worker.`
        : `Worker responded with HTTP ${response.status}: ${response.statusText}`
    });

    res.json({
      success,
      status: response.status,
      itemsPushed: snapshot.items.length,
      pushedAt: new Date().toISOString()
    });
  } catch (err: any) {
    db.updateSettings({
      lastWorkerSync: new Date().toISOString(),
      lastWorkerSyncStatus: 'failed',
      lastWorkerSyncMessage: `Sync failed: ${err.message}`
    });

    res.status(500).json({
      success: false,
      error: err.message || 'Push sync failed',
      pushedAt: new Date().toISOString()
    });
  }
});
