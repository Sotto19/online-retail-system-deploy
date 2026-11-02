import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', verifyToken, requireAdmin, createCategory);

export default router;
