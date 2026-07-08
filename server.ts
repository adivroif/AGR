/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { User, Order } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const TARGET_API_URL = 'https://aromaapplication-gqgscbffcmgeffdk.westeurope-01.azurewebsites.net';

// Helper to get all users from the remote DB
async function getLiveUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${TARGET_API_URL}/api/Users`);
    if (res.ok) {
      return await res.json() as User[];
    }
  } catch (e) {
    console.error('Error fetching live users:', e);
  }
  return [];
}

// Helper to get all orders from the remote DB
async function getLiveOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${TARGET_API_URL}/api/Orders`);
    if (res.ok) {
      return await res.json() as Order[];
    }
  } catch (e) {
    console.error('Error fetching live orders:', e);
  }
  return [];
}

// Live status board endpoint for both uppercase and lowercase paths
const handleBoardRequest = async (req: express.Request, res: express.Response) => {
  try {
    const [liveOrders, liveUsers] = await Promise.all([getLiveOrders(), getLiveUsers()]);
    
    const prep = liveOrders
      .filter(o => o.status === 'Pending' || o.status === 'Preparing')
      .map(o => {
        const u = liveUsers.find(user => user.userId === o.userId);
        return {
          orderNumber: o.orderNumber.toString(),
          customerName: u ? u.fullName : 'אורח ארומה',
          source: 'user' as const,
          id: o.orderId
        };
      });

    const rd = liveOrders
      .filter(o => o.status === 'Ready')
      .map(o => {
        const u = liveUsers.find(user => user.userId === o.userId);
        return {
          orderNumber: o.orderNumber.toString(),
          customerName: u ? u.fullName : 'אורח ארומה',
          source: 'user' as const,
          id: o.orderId
        };
      });

    res.json({ preparing: prep, ready: rd });
  } catch (err) {
    console.error('Error building live status board:', err);
    res.status(500).json({ error: 'Failed to build live status board' });
  }
};

app.get('/api/orders/board', handleBoardRequest);
app.get('/api/Orders/board', handleBoardRequest);

// External Database API Proxy Middleware
app.use('/api', async (req, res, next) => {
  const normalizedPath = req.path.toLowerCase();
  
  // Custom board paths are already handled above by specific router rules.
  // Proxy everything else.
  const targetUrl = `${TARGET_API_URL}${req.originalUrl}`;
  
  // Forward headers (except host and other hop-by-hop headers to avoid SSL or validation errors)
  const headers: Record<string, string> = {};
  const forbiddenHeaders = [
    'host',
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'content-length'
  ];

  for (const [key, value] of Object.entries(req.headers)) {
    if (value && typeof value === 'string') {
      if (forbiddenHeaders.includes(key.toLowerCase())) continue;
      headers[key] = value;
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }

  try {
    const options: RequestInit = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);

    // Set response headers from the remote API
    response.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'transfer-encoding' && name.toLowerCase() !== 'content-encoding') {
        res.setHeader(name, value);
      }
    });

    res.status(response.status);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      let data = await response.json();
      
      // Normalize products data if returned from Azure
      if (req.path.toLowerCase().includes('/products')) {
        const normalizeProd = (p: any) => {
          if (!p) return p;
          return {
            ...p,
            price: p.price !== undefined ? Number(p.price) : (p.productPrice !== undefined ? Number(p.productPrice) : 0),
            productPrice: p.productPrice !== undefined ? Number(p.productPrice) : (p.price !== undefined ? Number(p.price) : 0),
            productDescription: p.productDescription !== undefined ? p.productDescription : (p.productDisplayTitle || '')
          };
        };
        if (Array.isArray(data)) {
          data = data.map(normalizeProd);
        } else if (data && typeof data === 'object') {
          data = normalizeProd(data);
        }
      }
      
      // Normalize categories data if returned from Azure
      if (req.path.toLowerCase().includes('/categories')) {
        const normalizeCat = (c: any) => {
          if (!c) return c;
          return {
            ...c,
            image_url: c.image_url !== undefined ? c.image_url : (c.imageUrl !== undefined ? c.imageUrl : ''),
            imageUrl: c.imageUrl !== undefined ? c.imageUrl : (c.image_url !== undefined ? c.image_url : '')
          };
        };
        if (Array.isArray(data)) {
          data = data.map(normalizeCat);
        } else if (data && typeof data === 'object') {
          data = normalizeCat(data);
        }
      }

      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (error) {
    console.error(`[Proxy Error] Failed to connect to ${targetUrl}:`, error);
    res.status(500).json({ error: 'Failed to connect to Azure Database API' });
  }
});

// ==========================================
//          VITE MIDDLEWARE INJECTION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
