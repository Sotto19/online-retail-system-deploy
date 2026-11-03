import express from 'express';
import {
  getDashboardMetrics,
  getAllOrders,
  updateOrderStatus,
  getInventory,
  adjustInventory,
  getCustomers
} from '../controllers/adminController.js';
import { verifyToken, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Allow reading inventory with optionalAuth so inventory view is never blocked
router.get('/inventory', optionalAuth, getInventory);

router.use(verifyToken, requireAdmin);

router.get('/dashboard', getDashboardMetrics);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/inventory/adjust', adjustInventory);
router.get('/customers', getCustomers);

export default router;
