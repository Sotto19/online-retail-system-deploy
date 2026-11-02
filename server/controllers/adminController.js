import pool, { isDbConnected, mockData } from '../config/db.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    if (isDbConnected()) {
      // Total Sales Revenue
      const [salesRes] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as totalRevenue FROM orders WHERE order_status != "cancelled"');
      // Total Orders
      const [ordersRes] = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
      // Total Customers
      const [customersRes] = await pool.query('SELECT COUNT(*) as totalCustomers FROM users WHERE role = "customer"');
      // Low Stock Alert Count
      const [lowStockRes] = await pool.query('SELECT COUNT(*) as lowStockCount FROM products WHERE stock_quantity <= reorder_level AND status = "active"');
      // Recent Orders (last 5)
      const [recentOrders] = await pool.query(`
        SELECT o.id, o.order_number, o.total_amount, o.order_status, o.created_at, u.name as customer_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);
      // Low stock product list
      const [lowStockProducts] = await pool.query(`
        SELECT id, sku, title, stock_quantity, reorder_level, price
        FROM products
        WHERE stock_quantity <= reorder_level AND status = "active"
        LIMIT 5
      `);

      return res.json({
        success: true,
        metrics: {
          totalRevenue: parseFloat(salesRes[0].totalRevenue),
          totalOrders: ordersRes[0].totalOrders,
          totalCustomers: customersRes[0].totalCustomers,
          lowStockCount: lowStockRes[0].lowStockCount,
          recentOrders,
          lowStockProducts
        }
      });
    } else {
      // Mock Data metrics
      const totalRevenue = mockData.orders
        .filter(o => o.order_status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0);

      const totalOrders = mockData.orders.length;
      const totalCustomers = mockData.users.filter(u => u.role === 'customer').length;
      const lowStockProducts = mockData.products.filter(p => p.stock_quantity <= p.reorder_level && p.status === 'active');

      const recentOrders = mockData.orders.slice(0, 5).map(o => {
        const u = mockData.users.find(user => user.id === o.user_id);
        return {
          id: o.id,
          order_number: o.order_number,
          total_amount: o.total_amount,
          order_status: o.order_status,
          created_at: o.created_at,
          customer_name: u ? u.name : 'Customer'
        };
      });

      return res.json({
        success: true,
        metrics: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalOrders,
          totalCustomers,
          lowStockCount: lowStockProducts.length,
          recentOrders,
          lowStockProducts: lowStockProducts.slice(0, 5)
        }
      });
    }
  } catch (error) {
    console.error('getDashboardMetrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics.' });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    if (isDbConnected()) {
      let query = `
        SELECT o.*, u.name as customer_name, u.email as customer_email 
        FROM orders o 
        JOIN users u ON o.user_id = u.id
      `;
      const params = [];
      const where = [];

      if (status && status !== 'all') {
        where.push('o.order_status = ?');
        params.push(status);
      }
      if (search) {
        where.push('(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
        const p = `%${search}%`;
        params.push(p, p, p);
      }

      if (where.length > 0) query += ` WHERE ${where.join(' AND ')}`;
      query += ' ORDER BY o.created_at DESC';

      const [orders] = await pool.query(query, params);
      return res.json({ success: true, orders });
    } else {
      let orders = mockData.orders.map(o => {
        const u = mockData.users.find(user => user.id === o.user_id);
        return {
          ...o,
          customer_name: u ? u.name : 'Customer',
          customer_email: u ? u.email : ''
        };
      });

      if (status && status !== 'all') {
        orders = orders.filter(o => o.order_status === status);
      }
      if (search) {
        const s = search.toLowerCase();
        orders = orders.filter(o => o.order_number.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s));
      }

      return res.json({ success: true, orders });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    if (!status && !payment_status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    if (isDbConnected()) {
      await pool.query(
        'UPDATE orders SET order_status = COALESCE(?, order_status), payment_status = COALESCE(?, payment_status) WHERE id = ?',
        [status, payment_status, id]
      );
      return res.json({ success: true, message: 'Order status updated successfully!' });
    } else {
      const order = mockData.orders.find(o => o.id === parseInt(id, 10));
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      if (status) order.order_status = status;
      if (payment_status) order.payment_status = payment_status;

      return res.json({ success: true, message: 'Order status updated successfully!' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
};

export const getInventory = async (req, res) => {
  try {
    if (isDbConnected()) {
      const [inventory] = await pool.query(`
        SELECT p.id, p.sku, p.title, p.brand, p.price, p.cost_price, p.stock_quantity, p.reorder_level, p.status, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.stock_quantity ASC
      `);
      return res.json({ success: true, inventory });
    } else {
      const inventory = mockData.products.map(p => ({
        id: p.id,
        sku: p.sku,
        title: p.title,
        brand: p.brand,
        price: p.price,
        cost_price: p.cost_price,
        stock_quantity: p.stock_quantity,
        reorder_level: p.reorder_level,
        status: p.status,
        category_name: p.category_name
      })).sort((a, b) => a.stock_quantity - b.stock_quantity);

      return res.json({ success: true, inventory });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve inventory.' });
  }
};

export const adjustInventory = async (req, res) => {
  try {
    const { productId, changeType, quantity, notes } = req.body;

    if (!productId || !changeType || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID, change type, and quantity are required.' });
    }

    const qty = parseInt(quantity, 10);

    if (isDbConnected()) {
      const [prod] = await pool.query('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
      if (prod.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

      const current = prod[0].stock_quantity;
      const newStock = changeType === 'restock' ? current + qty : Math.max(0, current - qty);
      const delta = newStock - current;

      await pool.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, productId]);
      await pool.query(
        'INSERT INTO inventory_logs (product_id, change_type, quantity_change, new_quantity, notes) VALUES (?, ?, ?, ?, ?)',
        [productId, changeType, delta, newStock, notes || 'Admin stock adjustment']
      );

      return res.json({ success: true, message: 'Inventory updated successfully!', newStock });
    } else {
      const prod = mockData.products.find(p => p.id === parseInt(productId, 10));
      if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

      const current = prod.stock_quantity;
      const newStock = changeType === 'restock' ? current + qty : Math.max(0, current - qty);
      prod.stock_quantity = newStock;

      return res.json({ success: true, message: 'Inventory updated successfully!', newStock });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to adjust inventory.' });
  }
};

export const getCustomers = async (req, res) => {
  try {
    if (isDbConnected()) {
      const [customers] = await pool.query(`
        SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
               COUNT(o.id) as total_orders,
               COALESCE(SUM(o.total_amount), 0) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id AND o.order_status != 'cancelled'
        WHERE u.role = 'customer'
        GROUP BY u.id
        ORDER BY total_spent DESC
      `);
      return res.json({ success: true, customers });
    } else {
      const customers = mockData.users
        .filter(u => u.role === 'customer')
        .map(u => {
          const userOrders = mockData.orders.filter(o => o.user_id === u.id && o.order_status !== 'cancelled');
          const totalSpent = userOrders.reduce((sum, o) => sum + o.total_amount, 0);
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            status: u.status,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            total_orders: userOrders.length,
            total_spent: parseFloat(totalSpent.toFixed(2))
          };
        });

      return res.json({ success: true, customers });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customer list.' });
  }
};
