import { app } from '../server/app.js';

export default function handler(req: any, res: any) {
  if (req.query) {
    const subpath = req.query.__path
      ? String(req.query.__path)
      : req.query.path
      ? (Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path))
      : (req.query['0'] ? String(req.query['0']) : '');
    if (subpath && (!req.url || req.url === '/' || req.url === '/api' || req.url.startsWith('/api?'))) {
      const cleanSub = subpath.replace(/^\/+/, '');
      req.url = `/api/${cleanSub}`;
    }
  }

  return app(req, res);
}

