import { app } from '../../server/app.js';

export default function handler(req: any, res: any) {
  req.url = '/api/auth/me';
  return app(req, res);
}
