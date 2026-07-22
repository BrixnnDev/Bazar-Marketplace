const express = require('express')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

const router     = express.Router()
const JWT_SECRET = 'bazar_super_secret_key_2026_xK9mP2nQ'

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Sin token.' })
  try { req.user = jwt.verify(header.split(' ')[1], JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Token inválido.' }) }
}

/* ══════════════════════════════════════
   POST /api/purchases
   Compra un producto:
   - Descuenta saldo al comprador
   - Si el vendedor es un usuario (no admin), acredita el precio
   - Registra la compra en purchases
   - Marca como vendido el purchase del vendedor si existe
   - Oculta/elimina el producto si stock llega a 0
   - Crea notificación de venta para el vendedor
══════════════════════════════════════ */
router.post('/', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    const { productId } = req.body
    if (!productId) return res.status(400).json({ error: 'Falta productId.' })

    await client.query('BEGIN')

    /* 1. Verificar producto */
    const pR = await client.query(
      'SELECT * FROM products WHERE id=$1 AND visible=TRUE AND stock>0',
      [productId]
    )
    if (pR.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Producto no disponible o sin stock.' })
    }
    const product = pR.rows[0]

    /* 2. Verificar que el comprador no sea el mismo vendedor */
    const uR = await client.query('SELECT id, code, username, balance FROM users WHERE id=$1', [req.user.id])
    if (uR.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Usuario no encontrado.' }) }
    const buyer = uR.rows[0]

    if (product.seller_id === buyer.code) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'No puedes comprar tu propio producto.' })
    }

    /* 3. Verificar saldo */
    if (Number(buyer.balance) < Number(product.price)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Saldo insuficiente.' })
    }

    const price = Number(product.price)

    /* 4. Descontar saldo al comprador */
    await client.query('UPDATE users SET balance = balance - $1 WHERE id=$2', [price, buyer.id])

    /* 5. Si el vendedor es un usuario (no 'admin'), acreditar el precio */
    let sellerUser = null
    if (product.seller_id && product.seller_id !== 'admin') {
      const sR = await client.query(
        'SELECT id, code, username, balance FROM users WHERE code=$1',
        [product.seller_id]
      )
      if (sR.rows.length > 0) {
        sellerUser = sR.rows[0]
        await client.query('UPDATE users SET balance = balance + $1 WHERE id=$2', [price, sellerUser.id])
      }
    }

    /* 6. Reducir stock */
    const newStock = Number(product.stock) - 1
    await client.query(
      'UPDATE products SET stock = $1, sales = sales + 1, visible = $2 WHERE id=$3',
      [newStock, newStock > 0, productId]
    )

    /* 7. Registrar compra para el comprador */
    const ins = await client.query(
      `INSERT INTO purchases
         (buyer_id, buyer_code, product_id, product_name, product_emoji,
          category, category_label, price, seller, seller_id, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'disponible')
       RETURNING *`,
      [buyer.id, buyer.code, product.id, product.name, product.emoji || '📦',
       product.category, product.category_label, price,
       product.seller, product.seller_id, product.description || '']
    )

    /* 8. Si el vendedor publicó desde su cuenta de compras, marcarlo como vendido */
    if (sellerUser) {
      await client.query(
        `UPDATE purchases SET status='vendido', for_sale=false
         WHERE buyer_id=$1 AND product_id=$2 AND status='en_venta'`,
        [sellerUser.id, productId]
      )

      /* 9. Notificación de venta para el vendedor */
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, details)
         VALUES ($1,'venta','¡Vendiste un producto!',
           $2, $3)`,
        [
          sellerUser.id,
          `Tu producto "${product.name}" fue comprado por $${price.toLocaleString('es-CO')} COP.`,
          `Comprador: ${buyer.username} (${buyer.code}) · El dinero ya está en tu saldo.`,
        ]
      ).catch(() => {/* tabla puede no existir aún, no bloquear */})
    }

    /* 10. Obtener saldo actualizado del comprador */
    const updatedBuyer = await client.query('SELECT id, balance, credits FROM users WHERE id=$1', [buyer.id])

    await client.query('COMMIT')

    /* 11. Notificación de compra para el comprador (fuera de la transacción) */
    pool.query(
      `INSERT INTO notifications (user_id, type, title, body, details)
       VALUES ($1,'compra','Compra exitosa 🛒',$2,$3)`,
      [buyer.id,
       `Compraste "${product.name}" por $${price.toLocaleString('es-CO')} COP.`,
       `Lo puedes ver en "Mis compras · Vender" para revenderlo.`]
    ).catch(() => {})

    res.status(201).json({
      purchase:   serializePurchase(ins.rows[0]),
      newBalance: Number(updatedBuyer.rows[0].balance),
    })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('POST /purchases error:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

/* ══════════════════════════════════════
   GET /api/purchases/my
   Lista compras del usuario actual
══════════════════════════════════════ */
router.get('/my', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM purchases WHERE buyer_id=$1 ORDER BY created_at DESC`,
      [req.user.id]
    )
    res.json({ purchases: r.rows.map(serializePurchase) })
  } catch (err) {
    console.error('GET /purchases/my error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   GET /api/purchases/stats
   Estadísticas: compras, ventas y ganancias reales del usuario
══════════════════════════════════════ */
router.get('/stats', auth, async (req, res) => {
  try {
    // Compras totales del usuario
    const buyR = await pool.query(
      `SELECT COUNT(*) AS total_compras, COALESCE(SUM(price),0) AS total_gastado
       FROM purchases WHERE buyer_id=$1`,
      [req.user.id]
    )

    // Ganancias: productos que vendió (status=vendido) — sale_price - price original
    const sellR = await pool.query(
      `SELECT COUNT(*) AS total_ventas,
              COALESCE(SUM(sale_price - price), 0) AS ganancia_bruta
       FROM purchases
       WHERE buyer_id=$1 AND status='vendido' AND sale_price IS NOT NULL AND sale_price > price`,
      [req.user.id]
    )

    // También ganancias por ventas en products — cuando alguien compra un producto que publicó el usuario
    // Ya se acredita en balance, aquí solo calculamos la diferencia
    const profitR = await pool.query(
      `SELECT COALESCE(SUM(p.price - pu.price), 0) AS ganancia_reventa
       FROM products p
       JOIN purchases pu ON pu.product_id::int = p.id
       WHERE p.seller_id = (SELECT code FROM users WHERE id=$1)
         AND pu.buyer_id != $1`,
      [req.user.id]
    )

    res.json({
      totalCompras:    Number(buyR.rows[0].total_compras),
      totalGastado:    Number(buyR.rows[0].total_gastado),
      totalVentas:     Number(sellR.rows[0].total_ventas),
      gananciaReventa: Math.max(0, Number(profitR.rows[0].ganancia_reventa || 0)),
    })
  } catch (err) {
    console.error('GET /purchases/stats error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

function serializePurchase(r) {
  return {
    id:            r.id,
    buyerCode:     r.buyer_code,
    productId:     r.product_id,
    name:          r.product_name,
    emoji:         r.product_emoji || '📦',
    category:      r.category,
    categoryLabel: r.category_label,
    price:         Number(r.price),
    boughtFor:     Number(r.price),
    seller:        r.seller,
    sellerId:      r.seller_id,
    desc:          r.description || '',
    status:        r.status || 'disponible',
    forSale:       r.for_sale || false,
    salePrice:     r.sale_price ? Number(r.sale_price) : null,
    createdAt:     new Date(r.created_at).getTime(),
  }
}

module.exports = router

/* ══════════════════════════════════════
   PATCH /api/purchases/:id/sell
   Marca una compra como 'en_venta' — el usuario la publicó en el marketplace
══════════════════════════════════════ */
router.patch('/:id/sell', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE purchases SET status='en_venta', for_sale=true, sale_price=$1
       WHERE id=$2 AND buyer_id=$3 AND status='disponible'
       RETURNING *`,
      [req.body.salePrice || null, req.params.id, req.user.id]
    )
    if (r.rows.length === 0)
      return res.status(404).json({ error: 'Compra no encontrada o ya en venta.' })
    res.json({ purchase: serializePurchase(r.rows[0]) })
  } catch (err) {
    console.error('PATCH /purchases/sell error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   GET /api/purchases/activity
   Actividad global reciente (compras, ventas) para el Home
══════════════════════════════════════ */
router.get('/activity', auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        p.id, p.product_name AS item, p.price AS amount,
        u.username AS "user", p.created_at,
        'compra' AS type
      FROM purchases p
      JOIN users u ON u.id = p.buyer_id
      ORDER BY p.created_at DESC
      LIMIT 30
    `)
    const rows = r.rows.map(row => ({
      id:     row.id,
      type:   row.type,
      user:   row.user,
      item:   row.item,
      amount: Number(row.amount),
      time:   new Date(row.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    }))
    res.json({ activity: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   DELETE /api/purchases/:id
   Devuelve una compra — reembolsa el precio al comprador
   y restaura el stock del producto
══════════════════════════════════════ */
router.delete('/:id', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const pR = await client.query(
      `SELECT * FROM purchases WHERE id=$1 AND buyer_id=$2 AND status='disponible'`,
      [req.params.id, req.user.id]
    )
    if (pR.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Compra no encontrada o no se puede devolver.' })
    }
    const purchase = pR.rows[0]
    const price    = Number(purchase.price)

    // Reembolsar al comprador
    await client.query('UPDATE users SET balance = balance + $1 WHERE id=$2', [price, req.user.id])

    // Restaurar stock del producto (si aún existe)
    await client.query(
      `UPDATE products SET stock = stock + 1, visible = TRUE, sales = GREATEST(sales - 1, 0)
       WHERE id = $1`,
      [purchase.product_id]
    )

    // Eliminar la compra
    await client.query('DELETE FROM purchases WHERE id=$1', [req.params.id])

    // Obtener nuevo saldo
    const uR = await client.query('SELECT balance FROM users WHERE id=$1', [req.user.id])

    // Notificación sistema
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, details)
       VALUES ($1,'sistema','Devolución realizada 🔄',$2,$3)`,
      [req.user.id,
       `Has devuelto "${purchase.product_name}". Se te reembolsaron $${price.toLocaleString('es-CO')} COP.`,
       'El dinero ya está disponible en tu saldo.']
    )

    await client.query('COMMIT')
    res.json({ message: 'Devolución realizada.', newBalance: Number(uR.rows[0].balance) })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('DELETE /purchases error:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})
