import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, requireAdmin, createProduct);
router.put('/:id', verifyToken, requireAdmin, updateProduct);
router.delete('/:id', verifyToken, requireAdmin, deleteProduct);

export default router;
