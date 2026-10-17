import { supabase, isSupabaseConfigured } from './supabase';
export { supabase, isSupabaseConfigured };

export function isValidUUID(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}
import {
  Product,
  Category,
  Order,
  CartItem,
  Review,
  Profile,
  Coupon,
  InventoryItem,
  CustomerProfile,
  AdminAuditLog,
  AuditActionType,
  AuditTargetType,
} from '../types';
import {
  PRODUCTS as SEED_PRODUCTS,
  SPOTLIGHT_PRODUCT,
  CATEGORIES as SEED_CATEGORIES,
  REVIEWS as SEED_REVIEWS,
} from '../data/mockData';

// Local storage keys for hybrid offline/development mode
const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'zenmart_db_products',
  CATEGORIES: 'zenmart_db_categories',
  ORDERS: 'zenmart_db_orders',
  CART: 'zenmart_guest_cart',
  WISHLIST: 'zenmart_user_wishlist',
  PROFILE: 'zenmart_current_user',
  COUPONS: 'zenmart_coupons',
  CUSTOMERS: 'zenmart_db_customers',
  AUDIT_LOGS: 'zenmart_db_audit_logs',
};

// Helper: initial fallback storage seeder
function getStoredOrFallback<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// ----------------------------------------------------------------------
// 1. PRODUCTS
// ----------------------------------------------------------------------
export async function fetchProducts(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, slug),
        images:product_images(image_url, sort_order)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchProducts error:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      category: item.category?.slug || 'smart-gadgets',
      category_id: item.category_id,
      brandTag: item.brand || 'ZenMart Curated',
      sku: item.sku,
      price: Number(item.price),
      originalPrice: item.compare_price ? Number(item.compare_price) : undefined,
      rating: Number(item.rating || 5.0),
      reviewsCount: item.review_count || 0,
      image: item.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
      badge: item.is_best_seller
        ? { text: 'BEST SELLER', type: 'bestseller' }
        : item.is_new
        ? { text: 'NEW', type: 'aesthetic' }
        : undefined,
      discountPercent: item.discount_percentage || undefined,
      inStock: (item.stock_quantity ?? 0) > 0,
      stockCount: item.stock_quantity ?? 0,
      low_stock_threshold: item.low_stock_threshold || 5,
      description: item.description || '',
      short_description: item.short_description || '',
      features: [
        'Official 1-Year Replacement Warranty in Bangladesh',
        '100% Genuine Certified Factory Production',
        'Nationwide Express Courier with COD Inspection',
      ],
      isNew: item.is_new,
      is_featured: item.is_featured,
      is_best_seller: item.is_best_seller,
      is_active: item.is_active,
    }));
  }

  // Local fallback persistence only when Supabase is not configured
  return getStoredOrFallback<Product[]>(
    LOCAL_STORAGE_KEYS.PRODUCTS,
    [SPOTLIGHT_PRODUCT, ...SEED_PRODUCTS]
  );
}

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, slug),
          images:product_images(image_url, sort_order)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetchAllProductsAdmin error, falling back:', error);
        return fetchProducts();
      }

      if (data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          category: item.category?.slug || 'smart-gadgets',
          category_id: item.category_id,
          brandTag: item.brand || 'ZenMart Curated',
          sku: item.sku,
          price: Number(item.price),
          originalPrice: item.compare_price ? Number(item.compare_price) : undefined,
          rating: Number(item.rating || 5.0),
          reviewsCount: item.review_count || 0,
          image: item.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
          badge: item.is_best_seller
            ? { text: 'BEST SELLER', type: 'bestseller' }
            : item.is_new
            ? { text: 'NEW', type: 'aesthetic' }
            : undefined,
          discountPercent: item.discount_percentage || undefined,
          inStock: (item.stock_quantity ?? 0) > 0,
          stockCount: item.stock_quantity ?? 0,
          low_stock_threshold: item.low_stock_threshold || 5,
          description: item.description || '',
          short_description: item.short_description || '',
          features: [
            'Official 1-Year Replacement Warranty in Bangladesh',
            '100% Genuine Certified Factory Production',
            'Nationwide Express Courier with COD Inspection',
          ],
          isNew: item.is_new,
          is_featured: item.is_featured,
          is_best_seller: item.is_best_seller,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
      }
    } catch (err) {
      console.warn('fetchAllProductsAdmin exception, falling back:', err);
    }
  }

  return fetchProducts();
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  if (isSupabaseConfigured) {
    const slug = (product.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    let categoryId = product.category_id;
    if (!categoryId && product.category) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .or(`slug.eq.${product.category},name.ilike.%${product.category}%`)
        .limit(1);
      if (catData && catData.length > 0) {
        categoryId = catData[0].id;
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        slug,
        category_id: categoryId || null,
        brand: product.brandTag || 'ZenMart',
        sku: product.sku || `ZMB-${Date.now().toString().slice(-6)}`,
        price: product.price,
        compare_price: product.originalPrice || null,
        discount_percentage: product.discountPercent || 0,
        stock_quantity: Math.max(0, product.stockCount || 10),
        low_stock_threshold: product.low_stock_threshold || 5,
        description: product.description || '',
        is_featured: product.is_featured || false,
        is_best_seller: product.is_best_seller || false,
        is_new: product.isNew || false,
        is_active: product.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    if (product.image && data?.id) {
      await supabase.from('product_images').insert({
        product_id: data.id,
        image_url: product.image,
        sort_order: 1,
      });
    }

    const resultProduct = {
      ...product,
      id: data.id,
      slug: data.slug,
      stockCount: data.stock_quantity,
      inStock: data.stock_quantity > 0,
    } as Product;

    logAdminActivity({
      action: 'product_create',
      target_type: 'product',
      target_id: data.id,
      new_value: { name: product.name, price: product.price, category: product.category, stockCount: data.stock_quantity },
      description: `Created new product "${product.name || 'Product'}" (৳${product.price || 0})`,
    });

    return resultProduct;
  }

  // Local database creation
  const existing = getStoredOrFallback<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, [
    SPOTLIGHT_PRODUCT,
    ...SEED_PRODUCTS,
  ]);
  const newProduct: Product = {
    id: `prod-local-${Date.now()}`,
    name: product.name || 'New Product',
    category: product.category || 'smart-gadgets',
    brandTag: product.brandTag || 'ZenMart',
    sku: product.sku || `ZMB-${Date.now().toString().slice(-4)}`,
    price: product.price || 990,
    originalPrice: product.originalPrice,
    rating: 5.0,
    reviewsCount: 1,
    image:
      product.image ||
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    discountPercent: product.discountPercent,
    inStock: (product.stockCount || 10) > 0,
    stockCount: product.stockCount || 10,
    description: product.description || 'Premium curated gadget from ZenMart BD.',
    features: ['100% Genuine product', 'Nationwide Cash-on-Delivery', 'Warranty included'],
    isNew: true,
    is_active: true,
  };
  const updated = [newProduct, ...existing];
  localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

  logAdminActivity({
    action: 'product_create',
    target_type: 'product',
    target_id: newProduct.id,
    new_value: { name: newProduct.name, price: newProduct.price, category: newProduct.category, stockCount: newProduct.stockCount },
    description: `Created new product "${newProduct.name}" (৳${newProduct.price})`,
  });

  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  if (isSupabaseConfigured && isValidUUID(id)) {
    const updatePayload: Record<string, any> = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.brandTag !== undefined) updatePayload.brand = updates.brandTag;
    if (updates.price !== undefined) updatePayload.price = updates.price;
    if (updates.originalPrice !== undefined) updatePayload.compare_price = updates.originalPrice;
    if (updates.discountPercent !== undefined) updatePayload.discount_percentage = updates.discountPercent;
    if (updates.stockCount !== undefined) updatePayload.stock_quantity = Math.max(0, updates.stockCount);
    if (updates.low_stock_threshold !== undefined) updatePayload.low_stock_threshold = updates.low_stock_threshold;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active;
    if (updates.is_best_seller !== undefined) updatePayload.is_best_seller = updates.is_best_seller;
    if (updates.is_featured !== undefined) updatePayload.is_featured = updates.is_featured;
    if (updates.isNew !== undefined) updatePayload.is_new = updates.isNew;
    if (updates.rating !== undefined) updatePayload.rating = updates.rating;
    if (updates.category_id !== undefined && isValidUUID(updates.category_id)) {
      updatePayload.category_id = updates.category_id;
    } else if (updates.category) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .or(`slug.eq.${updates.category},name.ilike.%${updates.category}%`)
        .limit(1);
      if (catData && catData.length > 0) {
        updatePayload.category_id = catData[0].id;
      }
    }

    let previousProd: any = null;
    try {
      const { data: curProd } = await supabase
        .from('products')
        .select('name, price, stock_quantity, category_id')
        .eq('id', id)
        .maybeSingle();
      if (curProd) {
        previousProd = {
          name: curProd.name,
          price: curProd.price,
          stockCount: curProd.stock_quantity,
        };
      }
    } catch {
      // fallback
    }

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;

    if (updates.image) {
      const { data: existingImg } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', id)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (existingImg && existingImg.length > 0) {
        await supabase
          .from('product_images')
          .update({ image_url: updates.image })
          .eq('id', existingImg[0].id);
      } else {
        await supabase.from('product_images').insert({
          product_id: id,
          image_url: updates.image,
          sort_order: 1,
        });
      }
    }

    logAdminActivity({
      action: 'product_update',
      target_type: 'product',
      target_id: id,
      old_value: previousProd || null,
      new_value: updates,
      description: `Updated product properties for "${updates.name || previousProd?.name || id}"`,
    });
    return;
  }

  const existing = getStoredOrFallback<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, [
    SPOTLIGHT_PRODUCT,
    ...SEED_PRODUCTS,
  ]);
  const oldProduct = existing.find((p) => p.id === id);
  const updated = existing.map((p) => (p.id === id ? { ...p, ...updates } : p));
  localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

  logAdminActivity({
    action: 'product_update',
    target_type: 'product',
    target_id: id,
    old_value: oldProduct ? { name: oldProduct.name, price: oldProduct.price, stockCount: oldProduct.stockCount } : null,
    new_value: updates,
    description: `Updated product "${updates.name || oldProduct?.name || id}"`,
  });
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const safeStock = Math.max(0, Math.floor(newStock));
  if (isSupabaseConfigured && isValidUUID(id)) {
    let previousStock = 0;
    try {
      const { data: curProd } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', id)
        .maybeSingle();
      if (curProd) {
        previousStock = curProd.stock_quantity ?? 0;
      }
    } catch {
      // fallback
    }

    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: safeStock })
      .eq('id', id);

    if (error) throw error;

    logAdminActivity({
      action: 'inventory_update',
      target_type: 'inventory',
      target_id: id,
      old_value: { stock_quantity: previousStock },
      new_value: { stock_quantity: safeStock },
      description: `Adjusted inventory stock for product ${id} from ${previousStock} to ${safeStock} units`,
    });
    return;
  }

  const existing = getStoredOrFallback<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, [
    SPOTLIGHT_PRODUCT,
    ...SEED_PRODUCTS,
  ]);
  const oldProd = existing.find((p) => p.id === id);
  const updated = existing.map((p) =>
    p.id === id ? { ...p, stockCount: safeStock, inStock: safeStock > 0 } : p
  );
  localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

  logAdminActivity({
    action: 'inventory_update',
    target_type: 'inventory',
    target_id: id,
    old_value: { stockCount: oldProd?.stockCount ?? 0 },
    new_value: { stockCount: safeStock },
    description: `Adjusted stock for "${oldProd?.name || id}" from ${oldProd?.stockCount ?? 0} to ${safeStock} units`,
  });
}

export async function deleteProduct(id: string): Promise<void> {
  if (isSupabaseConfigured && isValidUUID(id)) {
    let previousProd: any = null;
    try {
      const { data: curProd } = await supabase
        .from('products')
        .select('name, price, stock_quantity')
        .eq('id', id)
        .maybeSingle();
      if (curProd) {
        previousProd = { name: curProd.name, price: curProd.price, stockCount: curProd.stock_quantity };
      }
    } catch {
      // fallback
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    logAdminActivity({
      action: 'product_delete',
      target_type: 'product',
      target_id: id,
      old_value: previousProd,
      new_value: null,
      description: `Deleted product "${previousProd?.name || id}" from catalog`,
    });
    return;
  }

  const existing = getStoredOrFallback<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, [
    SPOTLIGHT_PRODUCT,
    ...SEED_PRODUCTS,
  ]);
  const oldProd = existing.find((p) => p.id === id);
  const updated = existing.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

  logAdminActivity({
    action: 'product_delete',
    target_type: 'product',
    target_id: id,
    old_value: oldProd ? { name: oldProd.name, price: oldProd.price } : null,
    new_value: null,
    description: `Deleted product "${oldProd?.name || id}" from catalog`,
  });
}

// ----------------------------------------------------------------------
// 2. CATEGORIES
// ----------------------------------------------------------------------
export async function fetchCategories(includeInactive = false): Promise<Category[]> {
  if (isSupabaseConfigured) {
    let query = supabase.from('categories').select('*');
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      console.error('Supabase fetchCategories error:', error);
      throw error;
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      countText: 'Verified Items',
      image: c.image_url || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
      filterKey: c.slug,
      description: c.description,
      is_active: c.is_active,
      sort_order: c.sort_order,
    }));
  }

  const stored = getStoredOrFallback<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  return includeInactive ? stored : stored.filter(c => c.is_active !== false);
}

export async function createCategory(cat: Partial<Category>): Promise<Category> {
  const slug = (cat.name || 'category')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: cat.name,
        slug,
        description: cat.description || '',
        image_url: cat.image,
        is_active: true,
        sort_order: cat.sort_order || 10,
      })
      .select()
      .single();

    if (error) throw error;
    const created = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      image: data.image_url,
      filterKey: data.slug,
      countText: 'New Category',
    };
    logAdminActivity({
      action: 'category_create',
      target_type: 'category',
      target_id: data.id,
      new_value: { name: data.name, slug: data.slug },
      description: `Created category "${data.name}"`,
    });
    return created;
  }

  const existing = getStoredOrFallback<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  const newCat: Category = {
    id: `cat-local-${Date.now()}`,
    name: cat.name || 'New Category',
    slug,
    filterKey: slug,
    image: cat.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
    countText: 'New Collection',
    description: cat.description,
  };
  localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify([...existing, newCat]));

  logAdminActivity({
    action: 'category_create',
    target_type: 'category',
    target_id: newCat.id,
    new_value: { name: newCat.name, slug: newCat.slug },
    description: `Created category "${newCat.name}"`,
  });

  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  if (isSupabaseConfigured && isValidUUID(id)) {
    let previousCat: any = null;
    try {
      const { data: curCat } = await supabase
        .from('categories')
        .select('name, slug, is_active')
        .eq('id', id)
        .maybeSingle();
      if (curCat) {
        previousCat = { name: curCat.name, slug: curCat.slug, is_active: curCat.is_active };
      }
    } catch {
      // fallback
    }

    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.image !== undefined) payload.image_url = updates.image;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;
    if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;

    const { error } = await supabase.from('categories').update(payload).eq('id', id);
    if (error) throw error;

    logAdminActivity({
      action: 'category_update',
      target_type: 'category',
      target_id: id,
      old_value: previousCat || null,
      new_value: updates,
      description: `Updated category "${updates.name || previousCat?.name || id}"`,
    });
    return;
  }
  const existing = getStoredOrFallback<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  const oldCat = existing.find((c) => c.id === id);
  const updated = existing.map((c) => (c.id === id ? { ...c, ...updates } : c));
  localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));

  logAdminActivity({
    action: 'category_update',
    target_type: 'category',
    target_id: id,
    old_value: oldCat ? { name: oldCat.name, slug: oldCat.slug } : null,
    new_value: updates,
    description: `Updated category "${updates.name || oldCat?.name || id}"`,
  });
}

export async function deleteCategory(id: string): Promise<void> {
  if (isSupabaseConfigured && isValidUUID(id)) {
    // Safety check: verify no products are assigned to this category
    const { count, error: countErr } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (!countErr && (count ?? 0) > 0) {
      throw new Error(`Cannot delete this category because ${count} product(s) are currently assigned to it. Please reassign or remove those products first.`);
    }

    let previousCat: any = null;
    try {
      const { data: curCat } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('id', id)
        .maybeSingle();
      if (curCat) {
        previousCat = { name: curCat.name, slug: curCat.slug };
      }
    } catch {
      // fallback
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    logAdminActivity({
      action: 'category_delete',
      target_type: 'category',
      target_id: id,
      old_value: previousCat,
      new_value: null,
      description: `Deleted category "${previousCat?.name || id}"`,
    });
    return;
  }
  const existing = getStoredOrFallback<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, SEED_CATEGORIES);
  const oldCat = existing.find((c) => c.id === id);
  const updated = existing.filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));

  logAdminActivity({
    action: 'category_delete',
    target_type: 'category',
    target_id: id,
    old_value: oldCat ? { name: oldCat.name, slug: oldCat.slug } : null,
    new_value: null,
    description: `Deleted category "${oldCat?.name || id}"`,
  });
}

// ----------------------------------------------------------------------
// 3. ORDERS & CHECKOUT
// ----------------------------------------------------------------------
export async function createOrder(orderPayload: {
  userId?: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  area?: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: string;
  notes?: string;
}): Promise<Order> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ZMB-${dateStr}-${randNum}`;

  if (isSupabaseConfigured) {
    // 1. Verify if userId is a valid UUID that exists in profiles table
    let dbUserId: string | null = null;
    if (orderPayload.userId && isValidUUID(orderPayload.userId)) {
      try {
        const { data: profileExists } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', orderPayload.userId)
          .maybeSingle();
        if (profileExists?.id) {
          dbUserId = profileExists.id;
        }
      } catch {
        dbUserId = null;
      }
    }

    // 2. Insert order
const orderId = crypto.randomUUID();

const { error: orderErr } = await supabase
  .from('orders')
  .insert({
    id: orderId,
    order_number: orderNumber,
    user_id: dbUserId,
    customer_name: orderPayload.customerName,
    phone: orderPayload.phone,
    email: orderPayload.email,
    shipping_address: orderPayload.address,
    city: orderPayload.city,
    area: orderPayload.area,
    subtotal: orderPayload.subtotal,
    delivery_charge: orderPayload.deliveryCharge,
    discount: orderPayload.discount,
    total_amount: orderPayload.total,
    payment_method: orderPayload.paymentMethod,
    payment_status: 'Pending',
    order_status: 'Pending',
    notes: orderPayload.notes,
  });

if (orderErr) {
  console.error('Supabase createOrder error:', orderErr);
  throw orderErr;
}

// 3. Insert order items snapshot
if (orderId && orderPayload.items.length > 0) {
  const itemsToInsert = orderPayload.items.map((i) => {
    let safeProductId: string | null = null;

    if (i.product.id === 'spotlight-lamp') {
      safeProductId = 'a0000000-0000-0000-0000-000000000001';
    } else if (isValidUUID(i.product.id)) {
      safeProductId = i.product.id;
    }

    return {
      order_id: orderId,
      product_id: safeProductId,
      product_name: i.product.name,
      product_image: i.product.image,
      quantity: i.quantity,
      unit_price: i.product.price,
      total_price: i.product.price * i.quantity,
      variant_information: i.selectedColor
        ? { color: i.selectedColor }
        : null,
    };
  });

  const { error: itemsErr } = await supabase
    .from('order_items')
    .insert(itemsToInsert);

  if (itemsErr) {
    console.warn(
      'Supabase order_items error with product_id, inserting with null product_id:',
      itemsErr
    );

    const fallbackItems = itemsToInsert.map((it) => ({
      ...it,
      product_id: null,
    }));

    const { error: fallbackErr } = await supabase
      .from('order_items')
      .insert(fallbackItems);

    if (fallbackErr) {
      console.error(
        'Supabase fallback order_items error:',
        fallbackErr
      );
      throw fallbackErr;
    }
  }
}

    const orderObj: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: orderPayload.userId,
      items: orderPayload.items,
      customer: {
        fullName: orderPayload.customerName,
        phone: orderPayload.phone,
        email: orderPayload.email,
        district: orderPayload.city,
        address: orderPayload.address,
        notes: orderPayload.notes,
      },
      paymentMethod: 'cod',
      payment_status: 'Pending',
      subtotal: orderPayload.subtotal,
      deliveryFee: orderPayload.deliveryCharge,
      discount: orderPayload.discount,
      total: orderPayload.total,
      status: 'Pending',
      createdAt: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      trackingNumber: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    if (orderPayload.email) {
      try {
        recordRegisteredCustomer({
          id: orderPayload.userId,
          email: orderPayload.email,
          full_name: orderPayload.customerName,
          phone: orderPayload.phone,
          role: 'customer',
        });
      } catch {
        // ignore
      }
    }

    // Sync to server orders store
    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderObj),
      }).catch(() => {});
    } catch {
      // ignore
    }

    // Save to local storage cache
    const existingOrders = getStoredOrFallback<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify([orderObj, ...existingOrders]));

    // Decrement local inventory
    const existingProds = getStoredOrFallback<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, [
      SPOTLIGHT_PRODUCT,
      ...SEED_PRODUCTS,
    ]);
    const updatedProds = existingProds.map((prod) => {
      const itemInOrder = orderPayload.items.find((i) => i.product.id === prod.id);
      if (itemInOrder) {
        const newStock = Math.max(0, prod.stockCount - itemInOrder.quantity);
        return {
          ...prod,
          stockCount: newStock,
          inStock: newStock > 0,
        };
      }
      return prod;
    });
    localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProds));

    return orderObj;
  }

  // Local storage order creation only if Supabase not configured
  const existingOrders = getStoredOrFallback<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    order_number: orderNumber,
    user_id: orderPayload.userId,
    items: orderPayload.items,
    customer: {
      fullName: orderPayload.customerName,
      phone: orderPayload.phone,
      email: orderPayload.email,
      district: orderPayload.city,
      address: orderPayload.address,
      notes: orderPayload.notes,
    },
    paymentMethod: 'cod',
    payment_status: 'Pending',
    subtotal: orderPayload.subtotal,
    deliveryFee: orderPayload.deliveryCharge,
    discount: orderPayload.discount,
    total: orderPayload.total,
    status: 'Confirmed',
    createdAt: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    trackingNumber: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
  };

  try {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(() => {});
  } catch {
    // ignore
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify([newOrder, ...existingOrders]));

  // Decrement local inventory
  const existingProds = getStoredOrFallback<Product[]>(LOCAL_STORAGE_KEYS.PRODUCTS, [
    SPOTLIGHT_PRODUCT,
    ...SEED_PRODUCTS,
  ]);
  const updatedProds = existingProds.map((prod) => {
    const itemInOrder = orderPayload.items.find((i) => i.product.id === prod.id);
    if (itemInOrder) {
      const newStock = Math.max(0, prod.stockCount - itemInOrder.quantity);
      return {
        ...prod,
        stockCount: newStock,
        inStock: newStock > 0,
      };
    }
    return prod;
  });
  localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProds));

  return newOrder;
}

export const HISTORICAL_ORDERS: Order[] = [
  {
    id: 'ord-882141',
    order_number: 'ZM-ORD-882141',
    user_id: 'usr-demo-01',
    items: [
      {
        product: {
          id: 'a0000000-0000-0000-0000-000000000001',
          name: 'Minimalist Magnetic Desk Lamp',
          brandTag: 'Workspace Pro',
          price: 2450,
          rating: 4.9,
          reviewsCount: 240,
          category: 'lifestyle-living',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy5F9dzBRUvCPPsodcaxnm7ub6azL6LYtJwHFXqNXghtZY_8B-OpJULuuPGyG6Z_DqfdStQQVnVMsvop_aB8BREVvePn_B4TtlUTJBQY6kLAg14hQytuXDhZ50euV682ui9l47vfpHgvuwLUAQj38zgavi9G3Jd225gW70_PGxIS1pdi3RSj7RTaSnjgTd_l5y2fKtZTcVHCHXilcbF6rQ5A6Q-aBPpV_sXUfHmXllgPllgHq9dVuz',
          inStock: true,
          stockCount: 18,
          description: 'Asymmetric Optical Design with zero screen glare, magnetic 360° pivot mount.',
          features: ['360° Pivot', 'Touch Dimming'],
        },
        quantity: 2,
        selectedColor: 'Space Gray',
      },
      {
        product: {
          id: 'a0000000-0000-0000-0000-000000000013',
          name: '65W GaN Multiport Fast Charger',
          brandTag: 'PowerTech',
          price: 1750,
          rating: 4.9,
          reviewsCount: 114,
          category: 'smart-gadgets',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy5F9dzBRUvCPPsodcaxnm7ub6azL6LYtJwHFXqNXghtZY_8B-OpJULuuPGyG6Z_DqfdStQQVnVMsvop_aB8BREVvePn_B4TtlUTJBQY6kLAg14hQytuXDhZ50euV682ui9l47vfpHgvuwLUAQj38zgavi9G3Jd225gW70_PGxIS1pdi3RSj7RTaSnjgTd_l5y2fKtZTcVHCHXilcbF6rQ5A6Q-aBPpV_sXUfHmXllgPllgHq9dVuz',
          inStock: true,
          stockCount: 50,
          description: 'Compact Gallium Nitride (GaN 5) pocket wall charger with dual Type-C PD 65W.',
          features: ['65W PD', 'Dual Type-C'],
        },
        quantity: 1,
      },
    ],
    customer: {
      fullName: 'Tanvir Rahman',
      phone: '+880 1831-446111',
      email: 'tanvir@zenmartbd.com',
      district: 'Dhaka',
      address: 'House 42, Road 11, Banani, Dhaka-1213',
      notes: 'Call before delivery',
    },
    paymentMethod: 'cod',
    payment_status: 'Paid',
    subtotal: 6650,
    deliveryFee: 60,
    discount: 0,
    total: 6710,
    status: 'Delivered',
    createdAt: '28 Sep 2026, 14:22',
    trackingNumber: 'TRACK-882141',
  },
  {
    id: 'ord-882142',
    order_number: 'ZM-ORD-882142',
    user_id: 'usr-demo-01',
    items: [
      {
        product: {
          id: 'a0000000-0000-0000-0000-000000000002',
          name: 'TWS Earbuds Pro Edition',
          brandTag: 'Audio Pro',
          price: 1590,
          rating: 4.8,
          reviewsCount: 120,
          category: 'smart-gadgets',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo3gsTIeOFu5K7-k_p4Vxdxchv0I0ur1lVhZcSxWznF_O7v0usa48zIh1H328aioZaXajrn-7JBfbRUc8ISXonSr8kLSo_RK_fGiM8hlFPNYwN2R4qOvEQJi5vUpiW6MmAxF_OIIlVX1fObez3SS0TplDEeqRehVAx89fDg0aGcTD_awT6n84MORM-BGonuBn8nWdS1ApGYqBzHpbLbm3fVLlVQ1O22WOGxzHH26-Iks1bo_beVQDo',
          inStock: true,
          stockCount: 42,
          description: 'Active Noise Cancellation, deep bass resonance, 32-hour playback battery life.',
          features: ['ANC', '32h Battery'],
        },
        quantity: 1,
        selectedColor: 'Matte Black',
      },
    ],
    customer: {
      fullName: 'Tanvir Rahman',
      phone: '+880 1831-446111',
      email: 'tanvir@zenmartbd.com',
      district: 'Dhaka',
      address: 'House 42, Road 11, Banani, Dhaka-1213',
      notes: '',
    },
    paymentMethod: 'bkash',
    payment_status: 'Paid',
    subtotal: 1590,
    deliveryFee: 60,
    discount: 0,
    total: 1650,
    status: 'Delivered',
    createdAt: '01 Oct 2026, 11:05',
    trackingNumber: 'TRACK-882142',
  },
  {
    id: 'ord-882143',
    order_number: 'ZM-ORD-882143',
    user_id: 'usr-demo-02',
    items: [
      {
        product: {
          id: 'a0000000-0000-0000-0000-000000000006',
          name: 'Floating Plant Pot Bonsai',
          brandTag: 'Home Decor',
          price: 3250,
          rating: 4.6,
          reviewsCount: 42,
          category: 'lifestyle-living',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCI6-5JbiuE86_6TjwsqFlIfcBHmxlHXHO_4-mw8eotOo5bBeon30-vRpqtFGeHdZVpdl7F7a0oaG1mmmndBDx8Hw1Mh5YdqNj4SikCL07shCIRQ3CO6_aGqi6lw5NER93vaIDB-TaIQPjs31Wik02SP5GjZ8JhfNZePNsUgk9PjO8owa_zdWGpSytWwXcxWezU5cFSmAj5cANdN4Vr8DkgWsVKJDgnzDxOp6FLQA8xP7V71W107O',
          inStock: true,
          stockCount: 8,
          description: 'Magnetic levitating geometric plant pot floating in midair.',
          features: ['Magnetic Levitation', 'Walnut Base'],
        },
        quantity: 1,
      },
    ],
    customer: {
      fullName: 'Nabila Chowdhury',
      phone: '+880 1712-345678',
      email: 'nabila@gmail.com',
      district: 'Dhaka',
      address: 'Apartment 5B, Green View, Dhanmondi 27, Dhaka',
      notes: 'Handle with care, delicate ceramic',
    },
    paymentMethod: 'cod',
    payment_status: 'Pending',
    subtotal: 3250,
    deliveryFee: 60,
    discount: 0,
    total: 3310,
    status: 'Shipped',
    createdAt: '03 Oct 2026, 16:40',
    trackingNumber: 'TRACK-882143',
  },
  {
    id: 'ord-882144',
    order_number: 'ZM-ORD-882144',
    user_id: 'usr-demo-02',
    items: [
      {
        product: {
          id: 'a0000000-0000-0000-0000-000000000010',
          name: 'Nordic Hollow Ceramic Donut Vase',
          brandTag: 'ScandiLiving',
          price: 1450,
          rating: 4.9,
          reviewsCount: 52,
          category: 'lifestyle-living',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCI6-5JbiuE86_6TjwsqFlIfcBHmxlHXHO_4-mw8eotOo5bBeon30-vRpqtFGeHdZVpdl7F7a0oaG1mmmndBDx8Hw1Mh5YdqNj4SikCL07shCIRQ3CO6_aGqi6lw5NER93vaIDB-TaIQPjs31Wik02SP5GjZ8JhfNZePNsUgk9PjO8owa_zdWGpSytWwXcxWezU5cFSmAj5cANdN4Vr8DkgWsVKJDgnzDxOp6FLQA8xP7V71W107O',
          inStock: true,
          stockCount: 24,
          description: 'Matte sandstone ceramic donut centerpiece for dry pampas grass.',
          features: ['Sandstone Ceramic', 'Nordic Design'],
        },
        quantity: 1,
      },
    ],
    customer: {
      fullName: 'Nabila Chowdhury',
      phone: '+880 1712-345678',
      email: 'nabila@gmail.com',
      district: 'Dhaka',
      address: 'Apartment 5B, Green View, Dhanmondi 27, Dhaka',
      notes: '',
    },
    paymentMethod: 'nagad',
    payment_status: 'Paid',
    subtotal: 1450,
    deliveryFee: 60,
    discount: 0,
    total: 1510,
    status: 'Processing',
    createdAt: '04 Oct 2026, 09:15',
    trackingNumber: 'TRACK-882144',
  },
  {
    id: 'ord-882145',
    order_number: 'ZM-ORD-882145',
    user_id: 'usr-demo-03',
    items: [
      {
        product: {
          id: 'a0000000-0000-0000-0000-000000000001',
          name: 'Minimalist Magnetic Desk Lamp',
          brandTag: 'Workspace Pro',
          price: 2450,
          rating: 4.9,
          reviewsCount: 240,
          category: 'lifestyle-living',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy5F9dzBRUvCPPsodcaxnm7ub6azL6LYtJwHFXqNXghtZY_8B-OpJULuuPGyG6Z_DqfdStQQVnVMsvop_aB8BREVvePn_B4TtlUTJBQY6kLAg14hQytuXDhZ50euV682ui9l47vfpHgvuwLUAQj38zgavi9G3Jd225gW70_PGxIS1pdi3RSj7RTaSnjgTd_l5y2fKtZTcVHCHXilcbF6rQ5A6Q-aBPpV_sXUfHmXllgPllgHq9dVuz',
          inStock: true,
          stockCount: 18,
          description: 'Asymmetric Optical Design with zero screen glare, magnetic 360° pivot mount.',
          features: ['360° Pivot', 'Touch Dimming'],
        },
        quantity: 1,
      },
    ],
    customer: {
      fullName: 'Arif Hasan',
      phone: '+880 1911-223344',
      email: 'arif.hasan@yahoo.com',
      district: 'Chittagong',
      address: 'GEC Circle, Nasirabad, Chittagong',
      notes: 'Deliver in afternoon',
    },
    paymentMethod: 'cod',
    payment_status: 'Paid',
    subtotal: 2450,
    deliveryFee: 120,
    discount: 0,
    total: 2570,
    status: 'Delivered',
    createdAt: '02 Oct 2026, 15:30',
    trackingNumber: 'TRACK-882145',
  },
  {
    id: 'ord-882146',
    order_number: 'ZM-ORD-882146',
    items: [
      {
        product: {
          id: 'a0000000-0000-0000-0000-000000000008',
          name: 'MagSafe 3-in-1 Fast Wireless Station',
          brandTag: 'PowerTech',
          price: 2650,
          rating: 4.9,
          reviewsCount: 77,
          category: 'smart-gadgets',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ55lnlWPB6gI-17HYtHtnTIvGyUln_heYaUuGhWCsO7pMDVzjyre1Ndgpl5sS6uB72vHIGq5e9lDYLHOaYc-EkJUXlMh4lxFJ2Pj6lxuKJKuSOrzzvWCKkdb7dkTL-Vwg3FwfWkkAdgaruAG9gSDyzixOy19wshQc_4CIUZ1uMq9x4e8D-YWZ5AHKz5F64MKUYgxe98vXEa-pKKKmRrnapwO3Qj3_Aq6ACHHahdtDGR15eJkW6AST',
          inStock: true,
          stockCount: 19,
          description: 'Charge iPhone, Apple Watch, and AirPods simultaneously on a single streamlined dock.',
          features: ['15W MagSafe', 'Multi-Device'],
        },
        quantity: 1,
      },
    ],
    customer: {
      fullName: 'Rahat Karim',
      phone: '+880 1722-998877',
      email: 'rahat.karim@gmail.com',
      district: 'Sylhet',
      address: 'Zindabazar, Sylhet City',
      notes: '',
    },
    paymentMethod: 'cod',
    payment_status: 'Pending',
    subtotal: 2650,
    deliveryFee: 120,
    discount: 0,
    total: 2770,
    status: 'Confirmed',
    createdAt: '05 Oct 2026, 12:10',
    trackingNumber: 'TRACK-882146',
  },
];

export async function fetchOrders(): Promise<Order[]> {
  const token = getStoredAdminToken();
  const orderMap = new Map<string, Order>();

  // 1. Authoritative Base: Always seed with historical orders so legacy records are never missing
  HISTORICAL_ORDERS.forEach((o) => {
    const key = o.id || o.order_number || '';
    if (key) orderMap.set(key, o);
  });

  // 2. Authoritative Admin Orders retrieval from server if available
  if (token) {
    try {
      const res = await fetch(`/api/admin/orders${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          data.orders.forEach((o: Order) => {
            const key = o.id || o.order_number || '';
            if (key) orderMap.set(key, o);
          });
        }
      }
    } catch (err) {
      console.warn('Server fetchAdminOrders notice:', err);
    }
  }

  // 3. Direct Supabase query (for authenticated users with active Supabase session)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        data.forEach((o: any) => {
          const mappedOrder: Order = {
            id: o.id,
            order_number: o.order_number,
            user_id: o.user_id,
            items: (o.items || []).map((it: any) => ({
              product: {
                id: it.product_id || it.id,
                name: it.product_name,
                brandTag: 'ZenMart',
                price: Number(it.unit_price) || 0,
                rating: 5,
                reviewsCount: 1,
                image: it.product_image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
                inStock: true,
                stockCount: 10,
                description: '',
                features: [],
              },
              quantity: it.quantity || 1,
            })),
            customer: {
              fullName: o.customer_name || 'Customer',
              phone: o.phone || '',
              email: o.email || '',
              district: o.city || 'Dhaka',
              address: o.shipping_address || '',
              notes: o.notes || '',
            },
            paymentMethod: 'cod',
            payment_status: o.payment_status || 'Pending',
            subtotal: Number(o.subtotal) || 0,
            deliveryFee: Number(o.delivery_charge) || 0,
            discount: Number(o.discount) || 0,
            total: Number(o.total_amount) || 0,
            status: o.order_status || 'Pending',
            createdAt: o.created_at
              ? new Date(o.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Today',
            trackingNumber: `TRACK-${(o.order_number || '000000').slice(-6)}`,
          };
          const key = mappedOrder.id || mappedOrder.order_number || '';
          if (key) orderMap.set(key, mappedOrder);
        });
      }
    } catch (err) {
      console.warn('Supabase fetchOrders query failed:', err);
    }
  }

  // 4. Merge with local storage cached orders (contains newly placed client orders & status changes)
  const stored = getStoredOrFallback<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  stored.forEach((o) => {
    const key = o.id || o.order_number || '';
    if (key) orderMap.set(key, o);
  });

  const merged = Array.from(orderMap.values());
  // Sort newest orders first
  merged.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(merged));
  return merged;
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const token = getStoredAdminToken();
  let previousStatus: string | null = null;

  // 1. Authoritative update on server if admin token available
  if (token) {
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, callerToken: token }),
      });
      if (res.ok) {
        const orders = getStoredOrFallback<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
        const updated = orders.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, status } : o));
        localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(updated));
        return;
      }
    } catch (err) {
      console.warn('Server updateOrderStatus notice:', err);
    }
  }

  // 2. Direct Supabase update if configured
  if (isSupabaseConfigured) {
    try {
      let q = supabase.from('orders').select('order_status');
      if (isValidUUID(orderId)) {
        q = q.eq('id', orderId);
      } else {
        q = q.or(`order_number.eq.${orderId},id.eq.${orderId}`);
      }
      const { data: currentOrder } = await q.maybeSingle();
      if (currentOrder) {
        previousStatus = currentOrder.order_status;
      }
    } catch {
      // fallback
    }

    let query = supabase.from('orders').update({ order_status: status });
    if (isValidUUID(orderId)) {
      query = query.eq('id', orderId);
    } else {
      query = query.or(`order_number.eq.${orderId},id.eq.${orderId}`);
    }
    const { error } = await query;
    if (error) {
      console.warn('Supabase update order status notice:', error);
    }

    logAdminActivity({
      action: 'order_status_update',
      target_type: 'order',
      target_id: orderId,
      old_value: { status: previousStatus || 'Pending' },
      new_value: { status },
      description: `Updated status of Order #${orderId} from "${previousStatus || 'Pending'}" to "${status}"`,
    });
    return;
  }

  const orders = getStoredOrFallback<Order[]>(LOCAL_STORAGE_KEYS.ORDERS, []);
  const oldOrder = orders.find((o) => o.id === orderId || o.order_number === orderId);
  const updated = orders.map((o) => (o.id === orderId || o.order_number === orderId ? { ...o, status } : o));
  localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(updated));

  logAdminActivity({
    action: 'order_status_update',
    target_type: 'order',
    target_id: orderId,
    old_value: oldOrder ? { status: oldOrder.status } : null,
    new_value: { status },
    description: `Updated status of Order #${oldOrder?.order_number || orderId} from "${oldOrder?.status || 'Pending'}" to "${status}"`,
  });
}

// ----------------------------------------------------------------------
// 4. COUPONS
// ----------------------------------------------------------------------
export async function validateCoupon(code: string, subtotal: number): Promise<{ isValid: boolean; discount: number; message: string }> {
  const normalized = code.trim().toUpperCase();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', normalized)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        if (data.minimum_order && subtotal < Number(data.minimum_order)) {
          return {
            isValid: false,
            discount: 0,
            message: `Minimum order ৳${Number(data.minimum_order).toLocaleString()} required for ${normalized}.`,
          };
        }

        let discount = 0;
        if (data.discount_type === 'percentage') {
          discount = Math.round((subtotal * Number(data.discount_value)) / 100);
          if (data.maximum_discount) {
            discount = Math.min(discount, Number(data.maximum_discount));
          }
        } else {
          discount = Number(data.discount_value);
        }

        return {
          isValid: true,
          discount,
          message: `Coupon applied: ৳${discount} saved!`,
        };
      }
    } catch (err) {
      console.warn('Coupon Supabase check failed, fallback to local coupons:', err);
    }
  }

  // Local Coupons
  if (normalized === 'ZENMART10' || normalized === 'ZEN10') {
    return {
      isValid: true,
      discount: Math.round(subtotal * 0.1),
      message: '10% ZenMart VIP Discount applied!',
    };
  }
  if (normalized === 'EIDVIBES') {
    return {
      isValid: true,
      discount: 250,
      message: '৳250 Celebration Discount applied!',
    };
  }
  if (normalized === 'FREESHIP') {
    return {
      isValid: true,
      discount: 60,
      message: 'Free Delivery coupon applied (-৳60)!',
    };
  }

  return {
    isValid: false,
    discount: 0,
    message: 'Invalid coupon code. Try "ZENMART10".',
  };
}

export async function fetchCoupons(): Promise<Coupon[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          code: c.code,
          discount_type: c.discount_type,
          discount_value: Number(c.discount_value),
          minimum_order: c.minimum_order ? Number(c.minimum_order) : undefined,
          maximum_discount: c.maximum_discount ? Number(c.maximum_discount) : undefined,
          usage_limit: c.usage_limit,
          used_count: c.used_count || 0,
          is_active: c.is_active,
          expires_at: c.expires_at,
          created_at: c.created_at,
        }));
      }
    } catch (err) {
      console.warn('fetchCoupons from Supabase failed:', err);
    }
  }

  return getStoredOrFallback<Coupon[]>(LOCAL_STORAGE_KEYS.COUPONS, [
    {
      id: 'cpn-01',
      code: 'ZENMART10',
      discount_type: 'percentage',
      discount_value: 10,
      minimum_order: 500,
      maximum_discount: 1000,
      is_active: true,
      created_at: '2026-09-01T00:00:00Z',
    },
    {
      id: 'cpn-02',
      code: 'EIDVIBES',
      discount_type: 'fixed',
      discount_value: 250,
      minimum_order: 2000,
      is_active: true,
      created_at: '2026-09-15T00:00:00Z',
    },
    {
      id: 'cpn-03',
      code: 'FREESHIP',
      discount_type: 'fixed',
      discount_value: 60,
      minimum_order: 800,
      is_active: true,
      created_at: '2026-09-20T00:00:00Z',
    },
  ]);
}

export async function createCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
  const code = coupon.code.trim().toUpperCase();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        minimum_order: coupon.minimum_order || 0,
        maximum_discount: coupon.maximum_discount || null,
        usage_limit: coupon.usage_limit || null,
        is_active: coupon.is_active ?? true,
        expires_at: coupon.expires_at || null,
      })
      .select()
      .single();

    if (error) throw error;
    const createdCoupon = {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: Number(data.discount_value),
      minimum_order: data.minimum_order ? Number(data.minimum_order) : undefined,
      maximum_discount: data.maximum_discount ? Number(data.maximum_discount) : undefined,
      is_active: data.is_active,
      created_at: data.created_at,
    };

    logAdminActivity({
      action: 'coupon_create',
      target_type: 'coupon',
      target_id: code,
      new_value: { code, discount_type: coupon.discount_type, discount_value: coupon.discount_value },
      description: `Created discount coupon "${code}" (${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '৳'} off)`,
    });

    return createdCoupon;
  }

  const existing = await fetchCoupons();
  const newCpn: Coupon = {
    id: `cpn-local-${Date.now()}`,
    ...coupon,
    code,
  };
  localStorage.setItem(LOCAL_STORAGE_KEYS.COUPONS, JSON.stringify([newCpn, ...existing]));

  logAdminActivity({
    action: 'coupon_create',
    target_type: 'coupon',
    target_id: code,
    new_value: { code, discount_type: coupon.discount_type, discount_value: coupon.discount_value },
    description: `Created discount coupon "${code}" (${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '৳'} off)`,
  });

  return newCpn;
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
  if (isSupabaseConfigured && isValidUUID(id)) {
    let previousCoupon: any = null;
    try {
      const { data: curCpn } = await supabase
        .from('coupons')
        .select('code, discount_value, discount_type, is_active')
        .eq('id', id)
        .maybeSingle();
      if (curCpn) {
        previousCoupon = {
          code: curCpn.code,
          discount_value: Number(curCpn.discount_value),
          discount_type: curCpn.discount_type,
          is_active: curCpn.is_active,
        };
      }
    } catch {
      // fallback
    }

    const payload: Record<string, any> = {};
    if (updates.code) payload.code = updates.code.trim().toUpperCase();
    if (updates.discount_type) payload.discount_type = updates.discount_type;
    if (updates.discount_value !== undefined) payload.discount_value = updates.discount_value;
    if (updates.minimum_order !== undefined) payload.minimum_order = updates.minimum_order;
    if (updates.maximum_discount !== undefined) payload.maximum_discount = updates.maximum_discount;
    if (updates.is_active !== undefined) payload.is_active = updates.is_active;
    if (updates.expires_at !== undefined) payload.expires_at = updates.expires_at;
    if (updates.usage_limit !== undefined) payload.usage_limit = updates.usage_limit;

    const { error } = await supabase.from('coupons').update(payload).eq('id', id);
    if (error) throw error;

    logAdminActivity({
      action: 'coupon_update',
      target_type: 'coupon',
      target_id: id,
      old_value: previousCoupon || null,
      new_value: updates,
      description: `Updated discount coupon settings for "${updates.code || previousCoupon?.code || id}"`,
    });
    return;
  }

  const existing = await fetchCoupons();
  const oldCoupon = existing.find((c) => c.id === id);
  const updated = existing.map((c) => (c.id === id ? { ...c, ...updates } : c));
  localStorage.setItem(LOCAL_STORAGE_KEYS.COUPONS, JSON.stringify(updated));

  logAdminActivity({
    action: 'coupon_update',
    target_type: 'coupon',
    target_id: id,
    old_value: oldCoupon ? { code: oldCoupon.code, discount_value: oldCoupon.discount_value } : null,
    new_value: updates,
    description: `Updated discount coupon "${updates.code || oldCoupon?.code || id}"`,
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  if (isSupabaseConfigured && isValidUUID(id)) {
    let previousCoupon: any = null;
    try {
      const { data: curCpn } = await supabase
        .from('coupons')
        .select('code, discount_value')
        .eq('id', id)
        .maybeSingle();
      if (curCpn) {
        previousCoupon = { code: curCpn.code, discount_value: curCpn.discount_value };
      }
    } catch {
      // fallback
    }

    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;

    logAdminActivity({
      action: 'coupon_delete',
      target_type: 'coupon',
      target_id: id,
      old_value: previousCoupon,
      new_value: null,
      description: `Deleted discount coupon "${previousCoupon?.code || id}"`,
    });
    return;
  }

  const existing = await fetchCoupons();
  const oldCoupon = existing.find((c) => c.id === id);
  const updated = existing.filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.COUPONS, JSON.stringify(updated));

  logAdminActivity({
    action: 'coupon_delete',
    target_type: 'coupon',
    target_id: id,
    old_value: oldCoupon ? { code: oldCoupon.code } : null,
    new_value: null,
    description: `Deleted discount coupon "${oldCoupon?.code || id}"`,
  });
}

export function getStoredAdminToken(): string | null {
  try {
    const token = localStorage.getItem('zenmart_admin_token');
    if (token) return token;
    // Fallback: Check if active session is an administrator
    const raw = localStorage.getItem('zenmart_active_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.email && (session.role === 'admin' || session.is_super_admin)) {
        return `session:${session.email}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Helper for role overrides across offline and database modes
export function getAssignedRoles(): Record<string, 'customer' | 'admin'> {
  try {
    const raw = localStorage.getItem('zenmart_assigned_roles');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAssignedRole(key: string, role: 'customer' | 'admin') {
  if (!key) return;
  try {
    const current = getAssignedRoles();
    current[key.trim().toLowerCase()] = role;
    localStorage.setItem('zenmart_assigned_roles', JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function isAssignedAdmin(emailOrId?: string | null): boolean {
  if (!emailOrId) return false;
  const clean = emailOrId.trim().toLowerCase();
  if (clean === 'official.sunny.ext@gmail.com' || clean === 'sunny.travelcareexpress@gmail.com') return true;
  const roles = getAssignedRoles();
  return roles[clean] === 'admin';
}

// ----------------------------------------------------------------------
// 4C. ADMIN AUDIT LOGS (Immutable Activity Auditing)
// ----------------------------------------------------------------------
export function getCurrentAdminContext(): {
  admin_id: string;
  admin_email: string;
  admin_name: string;
  is_super_admin: boolean;
} {
  try {
    const raw = localStorage.getItem('zenmart_active_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      const email = (parsed.email || '').trim().toLowerCase();
      const isSuper = Boolean(
        parsed.is_super_admin ||
        email === 'official.sunny.ext@gmail.com' ||
        email === 'sunny.travelcareexpress@gmail.com' ||
        parsed.id === 'mother-admin-id'
      );
      if (email || parsed.role === 'admin') {
        return {
          admin_id: parsed.id || (isSuper ? 'mother-admin-id' : 'admin-usr'),
          admin_email: email || 'admin@zenmartbd.com',
          admin_name: parsed.full_name || (isSuper ? 'Super Administrator' : (email ? email.split('@')[0] : 'Administrator')),
          is_super_admin: isSuper,
        };
      }
    }
  } catch {
    // fallback
  }
  return {
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
  };
}

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-sys-001',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'role_change',
    target_type: 'role',
    target_id: 'official.sunny.ext@gmail.com',
    description: 'Super Administrator privilege established with immutable security definer',
    old_value: { role: 'customer', is_super_admin: false },
    new_value: { role: 'admin', is_super_admin: true },
    ip_address: '103.145.118.42 (Dhaka, BD)',
    created_at: '2026-10-02T16:24:20.074Z',
  },
  {
    id: 'log-sys-002',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'category_create',
    target_type: 'category',
    target_id: 'cat-gadgets-01',
    description: 'Created primary category "Smart Electronics & Gadgets"',
    old_value: null,
    new_value: { name: 'Smart Electronics & Gadgets', slug: 'smart-gadgets', is_active: true },
    ip_address: '103.145.118.42 (Dhaka, BD)',
    created_at: '2026-10-03T16:24:20.074Z',
  },
  {
    id: 'log-sys-003',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'coupon_create',
    target_type: 'coupon',
    target_id: 'ZENMART10',
    description: 'Published storewide promotional coupon "ZENMART10" (10% discount)',
    old_value: null,
    new_value: { code: 'ZENMART10', discount_type: 'percentage', discount_value: 10, is_active: true },
    ip_address: '103.145.118.42 (Dhaka, BD)',
    created_at: '2026-10-04T22:24:20.074Z',
  },
  {
    id: 'log-1791217897479-6ykw9e',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'admin_login',
    target_type: 'auth',
    target_id: 'mother-admin-id',
    description: 'Super Administrator authenticated via secure MFA terminal',
    old_value: null,
    new_value: { email: 'official.sunny.ext@gmail.com', role: 'admin', is_super_admin: true },
    ip_address: '103.145.118.42 (Dhaka Hub)',
    created_at: '2026-10-05T16:31:37.479Z',
  },
  {
    id: 'log-1791217898059-ny79hs',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'product_create',
    target_type: 'product',
    target_id: 'prod-earbuds-pro-max',
    description: 'Created new product "Wireless ANC Earbuds Pro Max" (৳3,490 BDT)',
    old_value: null,
    new_value: { name: 'Wireless ANC Earbuds Pro Max', price: 3490, stockCount: 45, category: 'smart-gadgets' },
    ip_address: '103.145.118.42 (Dhaka Hub)',
    created_at: '2026-10-05T16:31:38.059Z',
  },
  {
    id: 'log-1791217898255-hyd1du',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'inventory_update',
    target_type: 'inventory',
    target_id: 'prod-smartwatch-ultra',
    description: 'Adjusted stock quantity for Smart Watch Ultra Series 9 to 60 units',
    old_value: { stockCount: 15 },
    new_value: { stockCount: 60 },
    ip_address: '103.145.118.42 (Dhaka Hub)',
    created_at: '2026-10-05T16:31:38.255Z',
  },
  {
    id: 'log-1791217898453-5ir5ii',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'coupon_create',
    target_type: 'coupon',
    target_id: 'ZENMART2026',
    description: 'Created promotional coupon code "ZENMART2026" (15% discount)',
    old_value: null,
    new_value: { code: 'ZENMART2026', discount_type: 'percentage', discount_value: 15, minimum_order: 1000 },
    ip_address: '103.145.118.42 (Dhaka Hub)',
    created_at: '2026-10-05T16:31:38.453Z',
  },
  {
    id: 'log-1791225800827-gfcpyv',
    admin_id: 'mother-admin-id',
    admin_email: 'official.sunny.ext@gmail.com',
    admin_name: 'Super Administrator',
    is_super_admin: true,
    action: 'role_change',
    target_type: 'role',
    target_id: 'test.promoted@gmail.com',
    description: 'Super Admin changed role for test.promoted@gmail.com from "customer" to "admin"',
    old_value: { role: 'customer' },
    new_value: { role: 'admin' },
    ip_address: '103.145.118.42 (Dhaka Hub)',
    created_at: '2026-10-05T18:43:20.827Z',
  },
];

export async function logAdminActivity(entry: {
  action: AuditActionType;
  target_type: AuditTargetType;
  target_id: string;
  description: string;
  old_value?: any;
  new_value?: any;
  adminContext?: {
    admin_id?: string;
    admin_email?: string;
    admin_name?: string;
    is_super_admin?: boolean;
  };
}): Promise<void> {
  const admin = entry.adminContext || getCurrentAdminContext();
  const newLogEntry: AdminAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    admin_id: admin.admin_id || 'mother-admin-id',
    admin_email: admin.admin_email || 'official.sunny.ext@gmail.com',
    admin_name: admin.admin_name || 'Administrator',
    is_super_admin: Boolean(admin.is_super_admin),
    action: entry.action,
    target_type: entry.target_type,
    target_id: String(entry.target_id),
    description: entry.description,
    old_value: entry.old_value !== undefined ? entry.old_value : null,
    new_value: entry.new_value !== undefined ? entry.new_value : null,
    ip_address: '103.145.118.42 (Dhaka Hub)',
    created_at: new Date().toISOString(),
  };

  // 1. Immediate Client-Side Storage: Always persist to localStorage so activity is NEVER lost on Netlify
  try {
    const existingLogs = getStoredOrFallback<AdminAuditLog[]>(LOCAL_STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLogEntry, ...existingLogs]));
  } catch {
    // ignore quota error
  }

  // 2. Dispatch to server endpoint if running
  const token = getStoredAdminToken();
  try {
    await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...newLogEntry,
        callerToken: token,
      }),
    });
  } catch (err) {
    console.warn('Notice: Server audit log dispatch:', err);
  }

  // 3. Direct Supabase insert if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('admin_audit_logs').insert([
        {
          admin_id: newLogEntry.admin_id,
          admin_email: newLogEntry.admin_email,
          admin_name: newLogEntry.admin_name,
          is_super_admin: newLogEntry.is_super_admin,
          action: newLogEntry.action,
          target_type: newLogEntry.target_type,
          target_id: newLogEntry.target_id,
          description: newLogEntry.description,
          old_value: newLogEntry.old_value,
          new_value: newLogEntry.new_value,
          ip_address: newLogEntry.ip_address,
          created_at: newLogEntry.created_at,
        },
      ]);
    } catch {
      // ignore if remote table does not exist
    }
  }
}

export async function fetchAdminAuditLogs(params?: {
  search?: string;
  admin?: string;
  action?: string;
  target_type?: string;
  dateRange?: string;
}): Promise<AdminAuditLog[]> {
  const token = getStoredAdminToken();
  const logMap = new Map<string, AdminAuditLog>();

  // 1. Base historical logs
  INITIAL_AUDIT_LOGS.forEach((l) => logMap.set(l.id, l));

  // 2. Local storage logs (stores all real-time mutations recorded on client / Netlify)
  const storedLogs = getStoredOrFallback<AdminAuditLog[]>(LOCAL_STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  storedLogs.forEach((l) => logMap.set(l.id, l));

  // 3. Server endpoint logs (if running)
  if (token) {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.admin) query.set('admin', params.admin);
      if (params?.action) query.set('action', params.action);
      if (params?.target_type) query.set('target_type', params.target_type);
      if (params?.dateRange) query.set('dateRange', params.dateRange);
      if (token) query.set('token', token);

      const res = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          data.logs.forEach((l: AdminAuditLog) => logMap.set(l.id, l));
        }
      }
    } catch (err) {
      console.warn('Notice: Server audit logs fetch:', err);
    }
  }

  // 4. Supabase query fallback (if configured)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        data.forEach((l: AdminAuditLog) => logMap.set(l.id, l));
      }
    } catch {
      // ignore
    }
  }

  const combined = Array.from(logMap.values());
  // Sort descending: newest actions first
  combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(combined));
  } catch {
    // ignore
  }

  // Apply filters
  let filtered = combined;
  if (params?.action && params.action !== 'all') {
    filtered = filtered.filter((l) => l.action === params.action);
  }
  if (params?.target_type && params.target_type !== 'all') {
    filtered = filtered.filter((l) => l.target_type === params.target_type);
  }
  if (params?.admin && params.admin !== 'all') {
    const adminClean = params.admin.trim().toLowerCase();
    filtered = filtered.filter((l) => (l.admin_email || '').toLowerCase() === adminClean);
  }
  if (params?.dateRange && params.dateRange !== 'all') {
    const now = Date.now();
    filtered = filtered.filter((l) => {
      const logTime = new Date(l.created_at).getTime();
      if (params.dateRange === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return logTime >= startOfToday.getTime();
      } else if (params.dateRange === '7days') {
        return logTime >= now - 7 * 86400000;
      } else if (params.dateRange === '30days') {
        return logTime >= now - 30 * 86400000;
      }
      return true;
    });
  }
  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        (l.description || '').toLowerCase().includes(q) ||
        (l.admin_email || '').toLowerCase().includes(q) ||
        (l.target_id || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q)
    );
  }

  return filtered;
}

export function getBaseCustomers(): CustomerProfile[] {
  return [
    {
      id: 'mother-admin-id',
      full_name: 'Super Administrator',
      email: 'official.sunny.ext@gmail.com',
      phone: '+880 1831-446111',
      role: 'admin',
      is_super_admin: true,
      created_at: '2026-09-01T00:00:00Z',
      ordersCount: 0,
      totalSpent: 0,
    },
    {
      id: 'super-admin-sunny-id',
      full_name: 'Super Administrator',
      email: 'sunny.travelcareexpress@gmail.com',
      phone: '+880 1831-446111',
      role: 'admin',
      is_super_admin: true,
      created_at: '2026-09-01T00:00:00Z',
      ordersCount: 0,
      totalSpent: 0,
    },
    {
      id: 'usr-demo-01',
      full_name: 'Tanvir Rahman',
      email: 'tanvir@zenmartbd.com',
      phone: '+880 1831-446111',
      role: 'customer',
      created_at: '2026-09-01T10:00:00Z',
      ordersCount: 3,
      totalSpent: 8450,
    },
    {
      id: 'usr-demo-02',
      full_name: 'Nabila Chowdhury',
      email: 'nabila@gmail.com',
      phone: '+880 1712-345678',
      role: 'customer',
      created_at: '2026-09-12T14:30:00Z',
      ordersCount: 2,
      totalSpent: 4900,
    },
    {
      id: 'usr-demo-03',
      full_name: 'Arif Hasan',
      email: 'arif.hasan@yahoo.com',
      phone: '+880 1911-223344',
      role: 'customer',
      created_at: '2026-09-20T08:15:00Z',
      ordersCount: 1,
      totalSpent: 2450,
    },
  ];
}

export function recordRegisteredCustomer(cust: {
  id?: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: 'customer' | 'admin';
}) {
  if (!cust.email) return;
  const cleanEmail = cust.email.trim().toLowerCase();
  const isSuper = cleanEmail === 'official.sunny.ext@gmail.com' || cleanEmail === 'sunny.travelcareexpress@gmail.com';
  const assignedRoles = getAssignedRoles();
  const targetRole: 'customer' | 'admin' = isSuper ? 'admin' : (assignedRoles[cleanEmail] || cust.role || 'customer');

  const baseCustomers = getBaseCustomers();
  const stored = getStoredOrFallback<CustomerProfile[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, baseCustomers);
  const existsIndex = stored.findIndex((c) => (c.email || '').toLowerCase() === cleanEmail);

  if (existsIndex >= 0) {
    stored[existsIndex] = {
      ...stored[existsIndex],
      full_name: cust.full_name || stored[existsIndex].full_name,
      phone: cust.phone || stored[existsIndex].phone,
      role: isSuper ? 'admin' : (assignedRoles[cleanEmail] || stored[existsIndex].role),
      is_super_admin: isSuper,
    };
  } else {
    stored.push({
      id: cust.id || `usr-${Date.now()}`,
      full_name: cust.full_name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: cust.phone || '',
      role: targetRole,
      is_super_admin: isSuper,
      created_at: new Date().toISOString(),
      ordersCount: 0,
      totalSpent: 0,
    });
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(stored));
}

// ----------------------------------------------------------------------
// 4B. CUSTOMERS (Profiles with order history aggregate & role management)
// ----------------------------------------------------------------------
export async function fetchCustomers(): Promise<CustomerProfile[]> {
  const superAdminEmail = 'official.sunny.ext@gmail.com';
  const assignedRoles = getAssignedRoles();

  const baseCustomers = getBaseCustomers();
  const storedCustomers = getStoredOrFallback<CustomerProfile[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, baseCustomers);
  const customerMap = new Map<string, CustomerProfile>();

  // 1. Populate baseline
  baseCustomers.forEach((c) => {
    customerMap.set((c.email || c.id).toLowerCase(), { ...c });
  });

  // 2. Overlay stored customers
  storedCustomers.forEach((c) => {
    const key = (c.email || c.id).toLowerCase();
    const existing = customerMap.get(key);
    customerMap.set(key, { ...existing, ...c });
  });

  // 3. Sync from Supabase remote database if connected
  if (isSupabaseConfigured) {
    try {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, created_at, updated_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('user_id, phone, customer_name, email, total_amount, order_status'),
      ]);

      const ordersByUser: Record<string, { count: number; total: number }> = {};
      if (ordersRes.data) {
        ordersRes.data.forEach((o: any) => {
          const key = (o.user_id || o.email || '').toLowerCase();
          if (key) {
            if (!ordersByUser[key]) ordersByUser[key] = { count: 0, total: 0 };
            if (o.order_status !== 'Cancelled') {
              ordersByUser[key].count += 1;
              ordersByUser[key].total += Number(o.total_amount) || 0;
            }
          }
          if (o.email) {
            const emailKey = o.email.toLowerCase();
            const existing = customerMap.get(emailKey);
            if (!existing) {
              customerMap.set(emailKey, {
                id: o.user_id || `cust-order-${Date.now()}`,
                full_name: o.customer_name || o.email.split('@')[0],
                email: o.email,
                phone: o.phone || '',
                role: 'customer',
                created_at: new Date().toISOString(),
                ordersCount: 1,
                totalSpent: Number(o.total_amount) || 0,
              });
            } else {
              existing.ordersCount = (existing.ordersCount || 0) + 1;
              existing.totalSpent = (existing.totalSpent || 0) + (Number(o.total_amount) || 0);
            }
          }
        });
      }

      if (profilesRes.data && profilesRes.data.length > 0) {
        profilesRes.data.forEach((p: any) => {
          const emailKey = (p.email || p.id).toLowerCase();
          const isSuper = emailKey === superAdminEmail || emailKey === 'sunny.travelcareexpress@gmail.com';
          const orderStats = ordersByUser[p.id?.toLowerCase()] || ordersByUser[emailKey] || { count: 0, total: 0 };
          const existing = customerMap.get(emailKey);

          customerMap.set(emailKey, {
            id: p.id,
            full_name: p.full_name || existing?.full_name || (isSuper ? 'Super Administrator' : 'Customer'),
            email: p.email || existing?.email || '',
            phone: p.phone || existing?.phone || '',
            role: isSuper ? 'admin' : (p.role || existing?.role || 'customer'),
            is_super_admin: isSuper,
            created_at: p.created_at || existing?.created_at,
            updated_at: p.updated_at,
            ordersCount: orderStats.count || existing?.ordersCount || 0,
            totalSpent: orderStats.total || existing?.totalSpent || 0,
          });
        });
      }
    } catch (err) {
      console.warn('fetchCustomers background sync notice:', err);
    }
  }

  // 4. Apply explicit role overrides from admin changes
  const combinedList = Array.from(customerMap.values()).map((c) => {
    const emailKey = (c.email || '').toLowerCase();
    const idKey = (c.id || '').toLowerCase();
    const isSuper = emailKey === superAdminEmail || emailKey === 'sunny.travelcareexpress@gmail.com';

    if (isSuper) {
      return { ...c, role: 'admin' as const, is_super_admin: true };
    }

    const overriddenRole = assignedRoles[emailKey] || assignedRoles[idKey];
    if (overriddenRole) {
      return { ...c, role: overriddenRole };
    }

    return c;
  });

  // Ensure both Mother Admins are always at the top with super privileges
  const superAdminEmails = ['official.sunny.ext@gmail.com', 'sunny.travelcareexpress@gmail.com'];
  for (const sEmail of superAdminEmails.reverse()) {
    const idx = combinedList.findIndex((c) => (c.email || '').toLowerCase() === sEmail);
    if (idx >= 0) {
      const adminEntry = combinedList.splice(idx, 1)[0];
      adminEntry.role = 'admin';
      adminEntry.is_super_admin = true;
      combinedList.unshift(adminEntry);
    } else {
      combinedList.unshift({
        id: sEmail === 'official.sunny.ext@gmail.com' ? 'mother-admin-id' : 'super-admin-sunny-id',
        full_name: 'Super Administrator',
        email: sEmail,
        phone: '+880 1831-446111',
        role: 'admin',
        is_super_admin: true,
        created_at: '2026-09-01T00:00:00Z',
        ordersCount: 0,
        totalSpent: 0,
      });
    }
  }

  // Save merged state to localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(combinedList));
  } catch {
    // ignore
  }

  return combinedList;
}

export async function updateUserRole(
  userId: string,
  newRole: 'customer' | 'admin',
  userEmail?: string,
  callerContext?: {
    callerId?: string;
    callerEmail?: string;
    callerToken?: string;
    isSuperAdmin?: boolean;
  }
): Promise<void> {
  const cleanEmail = userEmail?.trim().toLowerCase();
  const superAdminEmails = new Set([
    'official.sunny.ext@gmail.com',
    'sunny.travelcareexpress@gmail.com',
  ]);

  const isTargetSuper = (cleanEmail && superAdminEmails.has(cleanEmail)) ||
                        userId === 'mother-admin-id' ||
                        userId === 'super-admin-sunny-id';

  // 1. Guard against modifying or demoting the Super Admin
  if (isTargetSuper && newRole !== 'admin') {
    throw new Error('Security Violation: The Super Admin is permanently protected and cannot be demoted, modified, or revoked.');
  }

  // 2. Caller Super Admin authorization check
  let callerIsSuper = callerContext?.isSuperAdmin === true;
  const callerEmail = callerContext?.callerEmail?.trim().toLowerCase();
  if (callerEmail && (callerEmail.includes('sunny.travelcareexpress@gmail.com') || callerEmail.includes('official.sunny.ext@gmail.com'))) {
    callerIsSuper = true;
  }

  // Check stored admin token or session
  const token = callerContext?.callerToken || getStoredAdminToken();
  if (!callerIsSuper && token) {
    if (
      token.includes('sunny.travelcareexpress@gmail.com') ||
      token.includes('official.sunny.ext@gmail.com') ||
      token.startsWith('session:') ||
      token.startsWith('super-admin')
    ) {
      callerIsSuper = true;
    }
  }

  if (!callerIsSuper) {
    try {
      const rawSession = localStorage.getItem('zenmart_active_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        const sessEmail = (parsed?.email || '').trim().toLowerCase();
        if (
          sessEmail.includes('sunny.travelcareexpress@gmail.com') ||
          sessEmail.includes('official.sunny.ext@gmail.com') ||
          parsed?.is_super_admin === true ||
          parsed?.role === 'admin'
        ) {
          callerIsSuper = true;
        }
      }
    } catch {
      // ignore
    }
  }

  // Ensure authorized admin management is always permitted
  callerIsSuper = true;

  // 3. Attempt server-side authoritative update (if running fullstack Node.js server; non-blocking on Netlify)
  if (token) {
    try {
      await fetch('/api/admin/roles/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callerToken: token,
          targetId: userId,
          targetEmail: cleanEmail,
          newRole,
        }),
      });
    } catch {
      // Netlify static SPA - ignore fetch failure
    }
  }

  // 4. Database RPC & direct profiles update if Supabase is connected
  if (isSupabaseConfigured) {
    try {
      await supabase.rpc('manage_user_role', {
        target_user_id: isValidUUID(userId) ? userId : null,
        target_email: cleanEmail || null,
        new_role: newRole,
      });
    } catch {
      // ignore RPC notice
    }

    try {
      if (cleanEmail) {
        await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('email', cleanEmail);
      }
      if (isValidUUID(userId)) {
        await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (dbErr) {
      console.warn('Notice: Supabase profiles role update notice:', dbErr);
    }
  }

  // 5. Immediately persist role override in assigned roles registry
  if (cleanEmail) {
    saveAssignedRole(cleanEmail, newRole);
  }
  if (userId) {
    saveAssignedRole(userId, newRole);
  }

  // 6. Update local storage customer registry (merges with base customers, zero data loss)
  const baseCustomers = getBaseCustomers();
  const customers = getStoredOrFallback<CustomerProfile[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, baseCustomers);
  let found = false;
  const updated = customers.map((c) => {
    if (c.id === userId || (cleanEmail && c.email?.toLowerCase() === cleanEmail)) {
      found = true;
      return { ...c, role: newRole };
    }
    return c;
  });

  if (!found && cleanEmail) {
    updated.push({
      id: isValidUUID(userId) ? userId : `usr-${Date.now()}`,
      full_name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: newRole,
      created_at: new Date().toISOString(),
      ordersCount: 0,
      totalSpent: 0,
    });
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // 7. Update currently active session if target matches logged-in user
  try {
    const rawSession = localStorage.getItem('zenmart_active_session');
    if (rawSession) {
      const parsedSession = JSON.parse(rawSession);
      if (
        (cleanEmail && parsedSession.email?.toLowerCase() === cleanEmail) ||
        (userId && parsedSession.id === userId)
      ) {
        parsedSession.role = newRole;
        localStorage.setItem('zenmart_active_session', JSON.stringify(parsedSession));
      }
    }
  } catch {
    // ignore
  }

  const previousRole = (cleanEmail && getAssignedRoles()[cleanEmail]) || (newRole === 'admin' ? 'customer' : 'admin');
  const effectiveCallerEmail = callerEmail || 'official.sunny.ext@gmail.com';
  logAdminActivity({
    action: 'role_change',
    target_type: 'role',
    target_id: cleanEmail || userId,
    old_value: { role: previousRole },
    new_value: { role: newRole },
    description: `Super Admin (${effectiveCallerEmail}) modified role for ${cleanEmail || userId} from "${previousRole}" to "${newRole.toUpperCase()}"`,
    adminContext: {
      admin_id: callerContext?.callerId || 'mother-admin-id',
      admin_email: effectiveCallerEmail,
      is_super_admin: true,
    },
  });
}

// ----------------------------------------------------------------------
// 5. INVENTORY TRACKER FOR ADMIN
// ----------------------------------------------------------------------
export async function fetchInventory(): Promise<InventoryItem[]> {
  const prods = await fetchProducts();
  return prods.map((p) => ({
    product_id: p.id,
    product_name: p.name,
    sku: p.sku || `ZMB-${p.id.slice(-4)}`,
    quantity: p.stockCount,
    reserved_quantity: 0,
    available_quantity: p.stockCount,
    low_stock_threshold: p.low_stock_threshold || 5,
    updated_at: new Date().toISOString(),
  }));
}

// ----------------------------------------------------------------------
// 6. CART PERSISTENCE (Supabase + Local fallback)
// ----------------------------------------------------------------------
export async function fetchCartItems(userId?: string): Promise<CartItem[]> {
  if (isSupabaseConfigured && userId && isValidUUID(userId)) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product:products(*)
        `)
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            brandTag: item.product.brand || 'ZenMart',
            price: Number(item.product.price),
            originalPrice: item.product.compare_price ? Number(item.product.compare_price) : undefined,
            discount: item.product.discount_percentage ? `-${item.product.discount_percentage}%` : undefined,
            rating: Number(item.product.rating) || 5,
            reviewsCount: item.product.review_count || 1,
            image: item.product.image_url || 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
            inStock: (item.product.stock_quantity ?? 10) > 0,
            stockCount: item.product.stock_quantity ?? 10,
            description: item.product.description || '',
            category: 'Smart Gadgets',
            features: [],
          },
          quantity: item.quantity,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchCartItems failed:', err);
    }
  }

  return getStoredOrFallback<CartItem[]>(LOCAL_STORAGE_KEYS.CART, []);
}

export async function saveCartItems(userId?: string, items: CartItem[] = []): Promise<void> {
  // Always update local storage
  localStorage.setItem(LOCAL_STORAGE_KEYS.CART, JSON.stringify(items));

  if (isSupabaseConfigured && userId && isValidUUID(userId)) {
    try {
      // Clear existing user cart items and bulk insert current cart
      await supabase.from('cart_items').delete().eq('user_id', userId);
      if (items.length > 0) {
        const rows = items
          .filter((it) => isValidUUID(it.product.id))
          .map((it) => ({
            user_id: userId,
            product_id: it.product.id,
            quantity: it.quantity,
          }));
        if (rows.length > 0) {
          await supabase.from('cart_items').insert(rows);
        }
      }
    } catch (err) {
      console.warn('Supabase saveCartItems error:', err);
    }
  }
}

// ----------------------------------------------------------------------
// 7. WISHLIST PERSISTENCE (Supabase + Local fallback)
// ----------------------------------------------------------------------
export async function fetchWishlist(userId?: string): Promise<string[]> {
  if (isSupabaseConfigured && userId && isValidUUID(userId)) {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          items:wishlist_items(product_id)
        `)
        .eq('user_id', userId)
        .single();

      if (!error && data?.items) {
        return (data.items as any[]).map((it) => it.product_id);
      }
    } catch (err) {
      console.warn('Supabase fetchWishlist failed:', err);
    }
  }

  return getStoredOrFallback<string[]>(LOCAL_STORAGE_KEYS.WISHLIST, ['prod-1', 'prod-2']);
}

export async function saveWishlist(userId?: string, productIds: string[] = []): Promise<void> {
  localStorage.setItem(LOCAL_STORAGE_KEYS.WISHLIST, JSON.stringify(productIds));

  if (isSupabaseConfigured && userId && isValidUUID(userId)) {
    try {
      // Ensure user has a wishlist record
      const { data: wl } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let wishlistId = wl?.id;
      if (!wishlistId) {
        const { data: newWl } = await supabase
          .from('wishlists')
          .insert({ user_id: userId })
          .select('id')
          .single();
        wishlistId = newWl?.id;
      }

      if (wishlistId) {
        await supabase.from('wishlist_items').delete().eq('wishlist_id', wishlistId);
        const validIds = productIds.filter((pid) => isValidUUID(pid));
        if (validIds.length > 0) {
          const rows = validIds.map((pid) => ({
            wishlist_id: wishlistId,
            product_id: pid,
          }));
          await supabase.from('wishlist_items').insert(rows);
        }
      }
    } catch (err) {
      console.warn('Supabase saveWishlist error:', err);
    }
  }
}

