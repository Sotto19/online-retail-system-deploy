import express from 'express';
import {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon
} from '../controllers/couponController.js';

const router = express.Router();

router.post('/validate', validateCoupon);
router.get('/', getAllCoupons);
router.post('/', createCoupon);
router.patch('/:id/toggle', toggleCouponStatus);
router.delete('/:id', deleteCoupon);

export default router;
