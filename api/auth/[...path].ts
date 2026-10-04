import { app } from '../../server/app.js';

export default function handler(req: any, res: any) {
  const p = req.query?.path ? (Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path)) : '';
  req.url = `/api/auth/${p}`;
  return app(req, res);
}
