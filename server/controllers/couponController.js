import pool, { isDbConnected, mockData } from '../config/db.js';

// Validate coupon code (Case-insensitive, checks active and expiry)
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount = 0 } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const cleanCode = code.trim().toUpperCase();

    let coupon = null;
    if (isDbConnected()) {
      const [rows] = await pool.query(
        'SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = TRUE AND (expires_at IS NULL OR expires_at >= CURDATE())',
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
    const minAmount = parseFloat(coupon.min_order_amount || 0);
    if (minAmount > 0 && amount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum purchase of ₹${minAmount.toLocaleString('en-IN')}`
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
        discount_value: parseFloat(coupon.discount_value),
        min_order_amount: minAmount,
        calculatedDiscount: parseFloat(discount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, message: 'Error validating coupon.' });
  }
};

// Retrieve all coupons (for admin and promo listings)
export const getAllCoupons = async (req, res) => {
  try {
    if (isDbConnected()) {
      const [rows] = await pool.query('SELECT * FROM coupons ORDER BY id ASC');
      return res.json({ success: true, coupons: rows });
    } else {
      return res.json({ success: true, coupons: mockData.coupons });
    }
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: 'Error fetching coupons.' });
  }
};

// Create a new coupon (Admin)
export const createCoupon = async (req, res) => {
  try {
    const { code, discount_type = 'percentage', discount_value, min_order_amount = 0, expires_at = '2027-12-31' } = req.body;
    if (!code || discount_value === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    if (isDbConnected()) {
      const [existing] = await pool.query('SELECT id FROM coupons WHERE UPPER(code) = ?', [cleanCode]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' already exists.` });
      }

      const [result] = await pool.query(
        'INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expires_at, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
        [cleanCode, discount_type, parseFloat(discount_value), parseFloat(min_order_amount || 0), expires_at || null]
      );

      return res.status(201).json({
        success: true,
        message: 'Coupon created successfully.',
        coupon: {
          id: result.insertId,
          code: cleanCode,
          discount_type,
          discount_value: parseFloat(discount_value),
          min_order_amount: parseFloat(min_order_amount || 0),
          expires_at: expires_at || null,
          is_active: 1
        }
      });
    } else {
      const existing = mockData.coupons.find(c => c.code.toUpperCase() === cleanCode);
      if (existing) {
        return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' already exists.` });
      }

      const newId = (mockData.coupons.length > 0 ? Math.max(...mockData.coupons.map(c => c.id)) : 0) + 1;
      const newCoupon = {
        id: newId,
        code: cleanCode,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_order_amount: parseFloat(min_order_amount || 0),
        expires_at: expires_at || '2027-12-31',
        is_active: 1
      };
      mockData.coupons.push(newCoupon);

      return res.status(201).json({
        success: true,
        message: 'Coupon created successfully.',
        coupon: newCoupon
      });
    }
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: 'Error creating coupon.' });
  }
};

// Toggle coupon status (active/inactive)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      const [rows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Coupon not found.' });

      const newActive = rows[0].is_active ? 0 : 1;
      await pool.query('UPDATE coupons SET is_active = ? WHERE id = ?', [newActive, id]);
      return res.json({
        success: true,
        message: `Coupon ${newActive ? 'activated' : 'deactivated'} successfully.`,
        is_active: newActive
      });
    } else {
      const coupon = mockData.coupons.find(c => c.id === parseInt(id, 10));
      if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

      coupon.is_active = coupon.is_active ? 0 : 1;
      return res.json({
        success: true,
        message: `Coupon ${coupon.is_active ? 'activated' : 'deactivated'} successfully.`,
        is_active: coupon.is_active
      });
    }
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({ success: false, message: 'Error toggling coupon status.' });
  }
};

// Delete a coupon
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Coupon deleted successfully.' });
    } else {
      const idx = mockData.coupons.findIndex(c => c.id === parseInt(id, 10));
      if (idx !== -1) mockData.coupons.splice(idx, 1);
      return res.json({ success: true, message: 'Coupon deleted successfully.' });
    }
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Error deleting coupon.' });
  }
};
