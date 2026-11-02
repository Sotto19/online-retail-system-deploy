import pool, { isDbConnected, mockData } from '../config/db.js';

export const getCategories = async (req, res) => {
  try {
    if (isDbConnected()) {
      const [categories] = await pool.query(
        'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.status = "active" GROUP BY c.id ORDER BY c.name ASC'
      );
      res.json({ success: true, categories });
    } else {
      const categories = mockData.categories.map(c => {
        const count = mockData.products.filter(p => p.category_id === c.id && p.status === 'active').length;
        return { ...c, product_count: count };
      });
      res.json({ success: true, categories });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (isDbConnected()) {
      const [resDb] = await pool.query(
        'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
        [name, slug, description || null, image_url || null]
      );
      res.status(201).json({ success: true, message: 'Category created!', id: resDb.insertId });
    } else {
      const newCat = {
        id: mockData.categories.length + 1,
        name,
        slug,
        description: description || '',
        image_url: image_url || '',
        is_active: 1
      };
      mockData.categories.push(newCat);
      res.status(201).json({ success: true, message: 'Category created!', id: newCat.id });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};
