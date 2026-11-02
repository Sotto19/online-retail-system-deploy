import pool, { isDbConnected, mockData } from '../config/db.js';

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isDbConnected()) {
      const query = `
        SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.image_url, p.stock_quantity, p.sku
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
      `;
      const [items] = await pool.query(query, [userId]);

      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      return res.json({ success: true, items, subtotal: parseFloat(subtotal.toFixed(2)) });
    } else {
      const userItems = mockData.cart.filter(c => c.user_id === userId);
      const items = userItems.map(c => {
        const prod = mockData.products.find(p => p.id === c.product_id);
        return {
          id: c.id,
          product_id: c.product_id,
          quantity: c.quantity,
          title: prod ? prod.title : 'Product',
          price: prod ? prod.price : 0,
          image_url: prod ? prod.image_url : '',
          stock_quantity: prod ? prod.stock_quantity : 10,
          sku: prod ? prod.sku : ''
        };
      });

      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      return res.json({ success: true, items, subtotal: parseFloat(subtotal.toFixed(2)) });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve cart items.', error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const qty = parseInt(quantity, 10) || 1;

    if (isDbConnected()) {
      const [prod] = await pool.query('SELECT id, stock_quantity, title FROM products WHERE id = ?', [productId]);
      if (prod.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

      if (prod[0].stock_quantity < qty) {
        return res.status(400).json({ success: false, message: `Only ${prod[0].stock_quantity} units available in stock.` });
      }

      await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
        [userId, productId, qty]
      );

      return res.json({ success: true, message: `Added "${prod[0].title}" to your cart.` });
    } else {
      const prod = mockData.products.find(p => p.id === parseInt(productId, 10));
      if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

      const existing = mockData.cart.find(c => c.user_id === userId && c.product_id === parseInt(productId, 10));
      if (existing) {
        existing.quantity += qty;
      } else {
        mockData.cart.push({
          id: mockData.cart.length + 1,
          user_id: userId,
          product_id: parseInt(productId, 10),
          quantity: qty
        });
      }

      return res.json({ success: true, message: `Added "${prod.title}" to your cart.` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add item to cart.', error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    const newQty = parseInt(quantity, 10);
    if (newQty <= 0) {
      return removeFromCart(req, res);
    }

    if (isDbConnected()) {
      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [newQty, id, userId]);
      return res.json({ success: true, message: 'Cart updated.' });
    } else {
      const item = mockData.cart.find(c => c.id === parseInt(id, 10) && c.user_id === userId);
      if (item) item.quantity = newQty;
      return res.json({ success: true, message: 'Cart updated.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (isDbConnected()) {
      await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ success: true, message: 'Item removed from cart.' });
    } else {
      const idx = mockData.cart.findIndex(c => c.id === parseInt(id, 10) && c.user_id === userId);
      if (idx !== -1) mockData.cart.splice(idx, 1);
      return res.json({ success: true, message: 'Item removed from cart.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    if (isDbConnected()) {
      await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    } else {
      mockData.cart = mockData.cart.filter(c => c.user_id !== userId);
    }
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
};
