import pool, { isDbConnected, mockData } from '../config/db.js';

export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount = 0 } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const cleanCode = code.trim().toUpperCase();

    let coupon = null;
    if (isDbConnected()) {
      const [rows] = await pool.query(
        'SELECT * FROM coupons WHERE code = ? AND is_active = TRUE AND (expires_at IS NULL OR expires_at >= CURDATE())',
        [cleanCode]
      );
      if (rows.length > 0) coupon = rows[0];
    } else {
      coupon = mockData.coupons.find(c => c.code.toUpperCase() === cleanCode && c.is_active);
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const amount = parseFloat(orderAmount);
    if (amount < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum purchase of ₹${coupon.min_order_amount}`
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (amount * parseFloat(coupon.discount_value)) / 100;
    } else {
      discount = parseFloat(coupon.discount_value);
    }

    if (discount > amount) discount = amount;

    res.json({
      success: true,
      message: 'Coupon applied successfully!',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        calculatedDiscount: parseFloat(discount.toFixed(2))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error validating coupon.' });
  }
};
