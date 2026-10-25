import express from 'express';
import path from 'path';
import { apiRouter } from './server/apiRouter.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Mount API router
app.use('/api', apiRouter);

// Serve static frontend build
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kilsta Business ICT Server running on http://0.0.0.0:${PORT}`);
});
