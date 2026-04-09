import { Router, type Request, type Response } from 'express';
import pkg from '../../../package.json';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),  // seconds since server started
    timestamp: new Date().toISOString(),
    version: pkg.version,
  });
});

export { router as healthRouter };
