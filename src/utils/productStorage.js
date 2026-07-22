import API from '../config/api'
export const PRODUCT_STORAGE_KEY = 'bazar_products'

export const CATEGORY_LABELS = {
  electrodomestico: 'Electrodoméstico',
  electronica: 'Electrónica',
  gaming: 'Gaming',
  ropa: 'Ropa y Calzado',
  deportes: 'Deportes',
  hogar: 'Hogar',
  vehiculos: 'Vehículos',
  libros: 'Libros',
  fotografia: 'Fotografía',
  otro: 'Otro',
}

function normalizeProduct(product, index = 0) {
  const safeName = typeof product?.name === 'string' && product.name.trim() ? product.name.trim() : `Producto ${index + 1}`
  const price = Number(product?.price ?? 0)
  const stock = Number(product?.stock ?? 0)
  const category = product?.category || 'electronica'
  return {
    ...product,
    id: product?.id ?? `product-${Date.now()}-${index}`,
    name: safeName,
    category,
    categoryLabel: product?.categoryLabel || CATEGORY_LABELS[category] || 'Otro',
    price: Number.isFinite(price) ? price : 0,
    stock: Number.isFinite(stock) ? stock : 0,
    visible: product?.visible !== false,
    emoji: product?.emoji || '📦',
    desc: typeof product?.desc === 'string' ? product.desc.trim() : '',
    seller: product?.seller || 'Administrador',
    sellerId: product?.sellerId || 'admin',
    rating: Number.isFinite(Number(product?.rating)) ? Number(product?.rating) : 4.8,
    sales: Number.isFinite(Number(product?.sales)) ? Number(product?.sales) : 0,
  }
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('bazar_token') : null
}

export async function fetchProductsFromAPI() {
  try {
    const res = await fetch(`${API}/api/products`)
    if (!res.ok) throw new Error('Server error')
    const data = await res.json()
    return (data.products || []).map((p, i) => normalizeProduct(p, i))
  } catch {
    return []
  }
}

export async function createProductAPI(form) {
  const token = getToken()
  const category = form.category || 'electronica'
  const res = await fetch(`${API}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name:          form.name.trim(),
      category,
      categoryLabel: CATEGORY_LABELS[category] || 'Otro',
      price:         Number(form.price),
      stock:         Number(form.stock),
      visible:       true,
      emoji:         form.emoji || '📦',
      desc:          (form.desc || '').trim(),
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error al crear producto')
  }
  const data = await res.json()
  return data.product
}

export async function updateProductAPI(id, form) {
  const token = getToken()
  const category = form.category || 'electronica'
  const res = await fetch(`${API}/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name:          form.name.trim(),
      category,
      categoryLabel: CATEGORY_LABELS[category] || 'Otro',
      price:         Number(form.price),
      stock:         Number(form.stock),
      emoji:         form.emoji || '📦',
      desc:          (form.desc || '').trim(),
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error al actualizar producto')
  }
  const data = await res.json()
  return data.product
}

export async function toggleVisibilityAPI(id, visible) {
  const token = getToken()
  const res = await fetch(`${API}/api/products/${id}/visibility`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ visible }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error al cambiar visibilidad')
  }
  const data = await res.json()
  return data.product
}

export async function deleteProductAPI(id) {
  const token = getToken()
  const res = await fetch(`${API}/api/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error al eliminar producto')
  }
}

export function buildProductFromForm(form, id = Date.now()) {
  const category = form.category || 'electronica'
  return {
    id,
    name: form.name.trim(),
    category,
    categoryLabel: CATEGORY_LABELS[category] || 'Otro',
    price: Number(form.price),
    stock: Number(form.stock),
    visible: true,
    emoji: form.emoji || '📦',
    desc: form.desc.trim(),
    seller: 'Administrador',
    sellerId: 'admin',
    rating: 4.8,
    sales: 0,
  }
}
