import { Router } from 'express';
import publicRoutes from './public.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/', publicRoutes);

export default router;
