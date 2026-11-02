import pool, { isDbConnected, mockData } from '../config/db.js';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      shippingAddress,
      paymentMethod = 'cod',
      couponCode,
      items
    } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required.' });
    }

    let orderItems = items;

    // If items not provided, load from user's cart
    if (!orderItems || orderItems.length === 0) {
      if (isDbConnected()) {
        const [cartRows] = await pool.query(
          `SELECT c.product_id, c.quantity, p.title as product_title, p.price, p.stock_quantity 
           FROM cart_items c 
           JOIN products p ON c.product_id = p.id 
           WHERE c.user_id = ?`,
          [userId]
        );
        orderItems = cartRows;
      } else {
        const userCart = mockData.cart.filter(c => c.user_id === userId);
        orderItems = userCart.map(c => {
          const p = mockData.products.find(prod => prod.id === c.product_id);
          return {
            product_id: c.product_id,
            quantity: c.quantity,
            product_title: p ? p.title : 'Product',
            price: p ? p.price : 0,
            stock_quantity: p ? p.stock_quantity : 10
          };
        });
      }
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Add products before checkout.' });
    }

    // Verify stock and compute subtotal
    let subtotal = 0;
    for (const item of orderItems) {
      if (item.stock_quantity !== undefined && item.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product_title}". Only ${item.stock_quantity} remaining.`
        });
      }
      subtotal += parseFloat(item.price) * item.quantity;
    }

    // Handle coupon
    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
      const clean = couponCode.trim().toUpperCase();
      let coupon = null;
      if (isDbConnected()) {
        const [cRows] = await pool.query('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE', [clean]);
        if (cRows.length > 0) coupon = cRows[0];
      } else {
        coupon = mockData.coupons.find(c => c.code === clean && c.is_active);
      }

      if (coupon && subtotal >= parseFloat(coupon.min_order_amount)) {
        couponId = coupon.id;
        discountAmount = coupon.discount_type === 'percentage'
          ? (subtotal * parseFloat(coupon.discount_value)) / 100
          : parseFloat(coupon.discount_value);
        if (discountAmount > subtotal) discountAmount = subtotal;
      }
    }

    const shippingFee = subtotal >= 499 ? 0.00 : 50.00;
    const taxAmount = parseFloat(((subtotal - discountAmount) * 0.05).toFixed(2));
    const totalAmount = parseFloat((subtotal - discountAmount + shippingFee + taxAmount).toFixed(2));
    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    if (isDbConnected()) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // 1. Insert Order
        const [orderResult] = await conn.query(
          `INSERT INTO orders 
           (order_number, user_id, coupon_id, subtotal, discount_amount, shipping_fee, tax_amount, total_amount, order_status, payment_method, payment_status, shipping_address)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
          [orderNumber, userId, couponId, subtotal, discountAmount, shippingFee, taxAmount, totalAmount, paymentMethod, paymentMethod === 'cod' ? 'pending' : 'paid', shippingAddress]
        );
        const orderId = orderResult.insertId;

        // 2. Insert Order Items & Deduct Stock
        for (const item of orderItems) {
          const itemTotal = parseFloat((parseFloat(item.price) * item.quantity).toFixed(2));
          const title = item.product_title || item.title || 'Product';
          await conn.query(
            `INSERT INTO order_items (order_id, product_id, product_title, price, quantity, total_price)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [orderId, item.product_id, title, parseFloat(item.price), item.quantity, itemTotal]
          );

          // Deduct stock
          await conn.query(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Record log
          await conn.query(
            `INSERT INTO inventory_logs (product_id, change_type, quantity_change, new_quantity, notes)
             SELECT id, 'sale', -?, stock_quantity, CONCAT('Sold in Order #', ?) FROM products WHERE id = ?`,
            [item.quantity, orderNumber, item.product_id]
          );
        }

        // 3. Clear cart
        await conn.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        await conn.commit();
        conn.release();

        return res.status(201).json({
          success: true,
          message: 'Order placed successfully!',
          orderNumber,
          orderId,
          totalAmount
        });
      } catch (err) {
        await conn.rollback();
        conn.release();
        throw err;
      }
    } else {
      // Mock Fallback
      const newOrder = {
        id: mockData.orders.length + 1,
        order_number: orderNumber,
        user_id: userId,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        shipping_fee: shippingFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        order_status: 'confirmed',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
        shipping_address: shippingAddress,
        created_at: new Date().toISOString(),
        items: orderItems.map(i => ({
          product_id: i.product_id,
          product_title: i.product_title || i.title || 'Product',
          price: parseFloat(i.price),
          quantity: i.quantity,
          total_price: parseFloat((parseFloat(i.price) * i.quantity).toFixed(2))
        }))
      };

      // Deduct mock stock
      for (const item of orderItems) {
        const p = mockData.products.find(prod => prod.id === item.product_id);
        if (p) p.stock_quantity = Math.max(0, p.stock_quantity - item.quantity);
      }

      mockData.orders.unshift(newOrder);
      mockData.cart = mockData.cart.filter(c => c.user_id !== userId);

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        orderNumber,
        orderId: newOrder.id,
        totalAmount
      });
    }
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order.', error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isDbConnected()) {
      const [orders] = await pool.query(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      for (const order of orders) {
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }

      res.json({ success: true, orders });
    } else {
      const userOrders = mockData.orders.filter(o => o.user_id === userId);
      res.json({ success: true, orders: userOrders });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order history.' });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderIdentifier } = req.params; // could be order_number or id
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    if (isDbConnected()) {
      const isNumeric = /^\d+$/.test(orderIdentifier);
      const query = isNumeric
        ? 'SELECT * FROM orders WHERE id = ?'
        : 'SELECT * FROM orders WHERE order_number = ?';

      const [rows] = await pool.query(query, [orderIdentifier]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      const order = rows[0];
      if (!isAdmin && order.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;

      res.json({ success: true, order });
    } else {
      const order = mockData.orders.find(o => o.id === parseInt(orderIdentifier, 10) || o.order_number === orderIdentifier);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      if (!isAdmin && order.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      res.json({ success: true, order });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving order details.' });
  }
};
