const express = require('express')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

const router     = express.Router()
const JWT_SECRET = 'bazar_super_secret_key_2026_xK9mP2nQ'

/* ── Middleware auth ── */
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Sin token.' })
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'administrador')
    return res.status(403).json({ error: 'Acceso denegado.' })
  next()
}

/* ══════════════════════════════════════
   GET /api/products
   Devuelve todos los productos visibles (sin auth)
══════════════════════════════════════ */
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, category, category_label, price, stock,
              visible, emoji, description, seller, seller_id,
              rating, sales, created_at, updated_at
       FROM products
       ORDER BY created_at DESC`
    )
    res.json({ products: r.rows.map(normalizeProduct) })
  } catch (err) {
    console.error('GET /products error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   POST /api/products  (auth requerido — admin y usuarios pueden crear)
   Admin crea productos del catálogo; usuarios publican sus compras para vender
══════════════════════════════════════ */
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, categoryLabel, price, stock, visible, emoji, desc, seller, sellerId } = req.body
    if (!name || !category || price == null || stock == null)
      return res.status(400).json({ error: 'Faltan campos obligatorios.' })

    const sellerName = seller || 'Administrador'
    const sellerIdVal = sellerId || 'admin'

    const r = await pool.query(
      `INSERT INTO products (name, category, category_label, price, stock, visible, emoji, description, seller, seller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name.trim(), category, categoryLabel || category, Number(price), Number(stock),
       visible !== false, emoji || '📦', (desc || '').trim(), sellerName, sellerIdVal]
    )
    res.status(201).json({ product: normalizeProduct(r.rows[0]) })
  } catch (err) {
    console.error('POST /products error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   PUT /api/products/:id  (solo admin)
   Actualiza un producto
══════════════════════════════════════ */
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { name, category, categoryLabel, price, stock, visible, emoji, desc } = req.body

    const r = await pool.query(
      `UPDATE products
       SET name=$1, category=$2, category_label=$3, price=$4, stock=$5,
           visible=$6, emoji=$7, description=$8, updated_at=NOW()
       WHERE id=$9
       RETURNING *`,
      [name.trim(), category, categoryLabel || category, Number(price), Number(stock),
       visible !== false, emoji || '📦', (desc || '').trim(), id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' })
    res.json({ product: normalizeProduct(r.rows[0]) })
  } catch (err) {
    console.error('PUT /products error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   PATCH /api/products/:id/visibility  (solo admin)
   Toggle visibilidad
══════════════════════════════════════ */
router.patch('/:id/visibility', auth, adminOnly, async (req, res) => {
  try {
    const { id }      = req.params
    const { visible } = req.body
    const r = await pool.query(
      `UPDATE products SET visible=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [visible, id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' })
    res.json({ product: normalizeProduct(r.rows[0]) })
  } catch (err) {
    console.error('PATCH /products visibility error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   DELETE /api/products/:id  (solo admin)
══════════════════════════════════════ */
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const r = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' })
    res.json({ message: 'Producto eliminado.' })
  } catch (err) {
    console.error('DELETE /products error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ── Normaliza la fila de DB al formato del frontend ── */
function normalizeProduct(row) {
  return {
    id:            row.id,
    name:          row.name,
    category:      row.category,
    categoryLabel: row.category_label,
    price:         Number(row.price),
    stock:         Number(row.stock),
    visible:       row.visible,
    emoji:         row.emoji || '📦',
    desc:          row.description || '',
    seller:        row.seller || 'Administrador',
    sellerId:      row.seller_id || 'admin',
    rating:        Number(row.rating ?? 4.8),
    sales:         Number(row.sales ?? 0),
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  }
}

module.exports = router
