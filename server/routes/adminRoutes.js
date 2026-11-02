import express from 'express';
import {
  getDashboardMetrics,
  getAllOrders,
  updateOrderStatus,
  getInventory,
  adjustInventory,
  getCustomers
} from '../controllers/adminController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/dashboard', getDashboardMetrics);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/inventory', getInventory);
router.post('/inventory/adjust', adjustInventory);
router.get('/customers', getCustomers);

export default router;
