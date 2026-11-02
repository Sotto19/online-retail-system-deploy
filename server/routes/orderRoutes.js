import express from 'express';
import { createOrder, getMyOrders, getOrderDetails } from '../controllers/orderController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:orderIdentifier', getOrderDetails);

export default router;
