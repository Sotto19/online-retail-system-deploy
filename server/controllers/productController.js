import pool, { isDbConnected, mockData } from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      sort = 'newest',
      status = 'active',
      page = 1,
      limit = 20,
      minPrice,
      maxPrice
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const pageLimit = parseInt(limit, 10);

    if (isDbConnected()) {
      let whereClauses = [];
      let params = [];

      if (status !== 'all') {
        whereClauses.push('p.status = ?');
        params.push(status);
      }

      if (category && category !== 'all') {
        whereClauses.push('(c.slug = ? OR c.id = ?)');
        params.push(category, category);
      }

      if (search) {
        whereClauses.push('(p.title LIKE ? OR p.brand LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      if (minPrice) {
        whereClauses.push('p.price >= ?');
        params.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        whereClauses.push('p.price <= ?');
        params.push(parseFloat(maxPrice));
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      let orderBy = 'p.created_at DESC';
      if (sort === 'price-asc') orderBy = 'p.price ASC';
      else if (sort === 'price-desc') orderBy = 'p.price DESC';
      else if (sort === 'rating') orderBy = 'p.rating DESC';
      else if (sort === 'title') orderBy = 'p.title ASC';

      // Count query
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereSql}`,
        params
      );
      const total = countResult[0].total;

      // Select query
      const query = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereSql}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;
      const [products] = await pool.query(query, [...params, pageLimit, offset]);

      return res.json({
        success: true,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / pageLimit),
        products
      });
    } else {
      // Mock Data Filtering
      let list = [...mockData.products];

      if (status !== 'all') {
        list = list.filter(p => p.status === status);
      }

      if (category && category !== 'all') {
        const cat = mockData.categories.find(c => c.slug === category || c.id === parseInt(category, 10));
        if (cat) {
          list = list.filter(p => p.category_id === cat.id);
        }
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q)
        );
      }

      if (minPrice) list = list.filter(p => p.price >= parseFloat(minPrice));
      if (maxPrice) list = list.filter(p => p.price <= parseFloat(maxPrice));

      if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
      else if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));

      const total = list.length;
      const paginated = list.slice(offset, offset + pageLimit);

      return res.json({
        success: true,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / pageLimit) || 1,
        products: paginated
      });
    }
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products.', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const isNumeric = /^\d+$/.test(id);
      const query = isNumeric
        ? `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`
        : `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?`;

      const [rows] = await pool.query(query, [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      const product = rows[0];

      // Related products
      const [related] = await pool.query(
        'SELECT * FROM products WHERE category_id = ? AND id != ? AND status = "active" LIMIT 4',
        [product.category_id, product.id]
      );

      return res.json({ success: true, product, related });
    } else {
      const isNumeric = /^\d+$/.test(id);
      const product = isNumeric
        ? mockData.products.find(p => p.id === parseInt(id, 10))
        : mockData.products.find(p => p.slug === id);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      const related = mockData.products.filter(p => p.category_id === product.category_id && p.id !== product.id).slice(0, 4);

      return res.json({ success: true, product, related });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product.', error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      sku,
      brand,
      category_id,
      price,
      cost_price,
      compare_price,
      stock_quantity = 0,
      reorder_level = 10,
      status = 'active',
      image_url,
      description
    } = req.body;

    if (!title || !price || !sku) {
      return res.status(400).json({ success: false, message: 'Title, SKU, and Price are required.' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    if (isDbConnected()) {
      const [exists] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
      if (exists.length > 0) {
        return res.status(409).json({ success: false, message: 'A product with this SKU already exists.' });
      }

      const [result] = await pool.query(
        `INSERT INTO products 
         (sku, title, slug, brand, category_id, price, cost_price, compare_price, stock_quantity, reorder_level, status, image_url, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sku, title, slug, brand || null, category_id || null, parseFloat(price), cost_price ? parseFloat(cost_price) : null, compare_price ? parseFloat(compare_price) : null, parseInt(stock_quantity, 10), parseInt(reorder_level, 10), status, image_url || null, description || null]
      );

      const productId = result.insertId;

      // Log initial stock
      if (parseInt(stock_quantity, 10) > 0) {
        await pool.query(
          `INSERT INTO inventory_logs (product_id, change_type, quantity_change, new_quantity, notes) VALUES (?, 'restock', ?, ?, 'Initial inventory stock')`,
          [productId, parseInt(stock_quantity, 10), parseInt(stock_quantity, 10)]
        );
      }

      return res.status(201).json({ success: true, message: 'Product created successfully!', productId });
    } else {
      const exists = mockData.products.find(p => p.sku === sku);
      if (exists) {
        return res.status(409).json({ success: false, message: 'A product with this SKU already exists.' });
      }

      const cat = mockData.categories.find(c => c.id === parseInt(category_id, 10));

      const newProduct = {
        id: mockData.products.length + 1,
        sku,
        title,
        slug,
        brand: brand || 'Generic',
        category_id: category_id ? parseInt(category_id, 10) : 1,
        category_name: cat ? cat.name : 'General',
        price: parseFloat(price),
        cost_price: cost_price ? parseFloat(cost_price) : null,
        compare_price: compare_price ? parseFloat(compare_price) : null,
        stock_quantity: parseInt(stock_quantity, 10),
        reorder_level: parseInt(reorder_level, 10),
        status,
        image_url: image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
        description: description || '',
        rating: 5.0,
        reviews_count: 0
      };

      mockData.products.unshift(newProduct);
      return res.status(201).json({ success: true, message: 'Product created successfully!', productId: newProduct.id });
    }
  } catch (error) {
    console.error('createProduct error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product.', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      brand,
      category_id,
      price,
      cost_price,
      compare_price,
      stock_quantity,
      reorder_level,
      status,
      image_url,
      description
    } = req.body;

    if (isDbConnected()) {
      const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      await pool.query(
        `UPDATE products SET 
          title = COALESCE(?, title),
          brand = COALESCE(?, brand),
          category_id = COALESCE(?, category_id),
          price = COALESCE(?, price),
          cost_price = COALESCE(?, cost_price),
          compare_price = COALESCE(?, compare_price),
          stock_quantity = COALESCE(?, stock_quantity),
          reorder_level = COALESCE(?, reorder_level),
          status = COALESCE(?, status),
          image_url = COALESCE(?, image_url),
          description = COALESCE(?, description)
        WHERE id = ?`,
        [title, brand, category_id, price ? parseFloat(price) : null, cost_price ? parseFloat(cost_price) : null, compare_price ? parseFloat(compare_price) : null, stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null, reorder_level !== undefined ? parseInt(reorder_level, 10) : null, status, image_url, description, id]
      );

      return res.json({ success: true, message: 'Product updated successfully!' });
    } else {
      const product = mockData.products.find(p => p.id === parseInt(id, 10));
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      if (title) product.title = title;
      if (brand) product.brand = brand;
      if (category_id) {
        product.category_id = parseInt(category_id, 10);
        const cat = mockData.categories.find(c => c.id === product.category_id);
        if (cat) product.category_name = cat.name;
      }
      if (price !== undefined) product.price = parseFloat(price);
      if (cost_price !== undefined) product.cost_price = parseFloat(cost_price);
      if (compare_price !== undefined) product.compare_price = parseFloat(compare_price);
      if (stock_quantity !== undefined) product.stock_quantity = parseInt(stock_quantity, 10);
      if (reorder_level !== undefined) product.reorder_level = parseInt(reorder_level, 10);
      if (status) product.status = status;
      if (image_url) product.image_url = image_url;
      if (description) product.description = description;

      return res.json({ success: true, message: 'Product updated successfully!' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product.', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      // Soft-delete or direct delete
      await pool.query('UPDATE products SET status = "inactive" WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Product marked as inactive.' });
    } else {
      const idx = mockData.products.findIndex(p => p.id === parseInt(id, 10));
      if (idx !== -1) {
        mockData.products[idx].status = 'inactive';
        return res.json({ success: true, message: 'Product marked as inactive.' });
      }
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};
