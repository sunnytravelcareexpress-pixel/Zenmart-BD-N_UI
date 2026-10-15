/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, CartItem, Order, InventoryItem, Category } from './types';
import { SPOTLIGHT_PRODUCT, CATEGORIES } from './data/mockData';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductGrid } from './components/ProductGrid';
import { LifestyleBanners } from './components/LifestyleBanners';
import { WhyChooseUs } from './components/WhyChooseUs';
import { CustomerReviews } from './components/CustomerReviews';
import { Newsletter } from './components/Newsletter';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { OrderTrackModal } from './components/OrderTrackModal';
import { AuthModal } from './components/AuthModal';
import { PolicyModal } from './components/PolicyModal';
import { Toast, ToastMessage } from './components/Toast';
import { AdminDashboard } from './components/AdminDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './lib/AuthContext';
import {
  fetchProducts,
  fetchOrders,
  fetchInventory,
  fetchCategories,
  fetchCartItems,
  saveCartItems,
  fetchWishlist,
  saveWishlist,
  isSupabaseConfigured,
} from './lib/databaseService';

function ZenMartStore() {
  const { user, role, isAdmin, isSuperAdmin } = useAuth();

  // Products & Categories from Supabase / Database Service
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>(CATEGORIES);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Cart state - loaded from storage / database
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('zenmart_cart_items');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [{ product: SPOTLIGHT_PRODUCT, quantity: 1 }];
  });

  // Wishlist - loaded from storage / database
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zenmart_wishlist_ids');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return ['prod-1', 'prod-2'];
  });

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Modals & Panels
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [orderTrackOpen, setOrderTrackOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  // Prevent background scrolling when Admin Dashboard overlay is open
  useEffect(() => {
    if (adminOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [adminOpen]);

  // Session Protection: Dismiss admin panel if active user is not verified admin
  useEffect(() => {
    if (!isAdmin && !isSuperAdmin && adminOpen) {
      setAdminOpen(false);
    }
  }, [isAdmin, isSuperAdmin, adminOpen]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [policyModal, setPolicyModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: '',
  });

  // Orders list
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Coupon state
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load products, inventory, orders & categories from databaseService
  const loadCatalog = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const [prods, invs, ords, cats] = await Promise.all([
        fetchProducts(),
        fetchInventory(),
        fetchOrders(),
        fetchCategories(true),
      ]);
      setProductsList(prods);
      setInventoryList(invs);
      setRecentOrders(ords);
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
    } catch (err) {
      console.error('Error fetching database catalog:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Re-fetch catalog & orders when administrative user authenticates or role updates
  useEffect(() => {
    if (user?.role === 'admin' || user?.is_super_admin) {
      loadCatalog();
    }
  }, [user?.id, user?.role, user?.is_super_admin, loadCatalog]);

  // Re-fetch catalog & orders when Admin Panel opens
  useEffect(() => {
    if (adminOpen) {
      loadCatalog();
    }
  }, [adminOpen, loadCatalog]);

  // Sync Cart with user session
  useEffect(() => {
    if (user?.id) {
      fetchCartItems(user.id).then((serverCart) => {
        if (serverCart && serverCart.length > 0) {
          setCartItems(serverCart);
        }
      });
      fetchWishlist(user.id).then((serverWishlist) => {
        if (serverWishlist && serverWishlist.length > 0) {
          setWishlistIds(serverWishlist);
        }
      });
    }
  }, [user?.id]);

  // Persist cart to local storage and DB
  useEffect(() => {
    try {
      localStorage.setItem('zenmart_cart_items', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
    if (user?.id) {
      saveCartItems(user.id, cartItems);
    }
  }, [cartItems, user?.id]);

  // Persist wishlist
  useEffect(() => {
    try {
      localStorage.setItem('zenmart_wishlist_ids', JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
    if (user?.id) {
      saveWishlist(user.id, wishlistIds);
    }
  }, [wishlistIds, user?.id]);

  // Calculations
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Combined product catalog
  const allProducts = useMemo(() => {
    if (productsList.length > 0) return productsList;
    return [SPOTLIGHT_PRODUCT];
  }, [productsList]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(
        (p) =>
          p.category.toLowerCase() === activeCategory.toLowerCase() ||
          p.subCategory?.toLowerCase() === activeCategory.toLowerCase() ||
          p.category.toLowerCase().replace(/\s+/g, '-') === activeCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brandTag.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [allProducts, activeCategory, searchQuery, sortBy]);

  // Cart actions with inventory checks
  const handleAddToCart = (product: Product, quantity = 1) => {
    // Inventory check
    const stockAvailable = product.stockCount ?? 50;
    const existing = cartItems.find((i) => i.product.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + quantity > stockAvailable) {
      addToast(`Only ${stockAvailable} units available in stock for this product`, 'info');
      return;
    }

    setCartItems((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
    addToast(`Added "${product.name}" to cart!`, 'success');
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const item = cartItems.find((i) => i.product.id === productId);
    const stock = item?.product.stockCount ?? 50;
    if (quantity > stock) {
      addToast(`Maximum stock limit reached (${stock} units)`, 'info');
      return;
    }

    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
    addToast('Item removed from cart', 'info');
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        addToast(`Removed "${product.name}" from wishlist`, 'info');
        return prev.filter((id) => id !== product.id);
      } else {
        addToast(`Saved "${product.name}" to wishlist!`, 'success');
        return [...prev, product.id];
      }
    });
  };

  const handleApplyDiscount = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'ZENMART10' || clean === 'ZEN10') {
      const discount = Math.round(cartSubtotal * 0.1);
      setDiscountCode(clean);
      setDiscountAmount(discount);
      addToast(`Coupon "${clean}" applied: 10% discount!`, 'success');
      return true;
    } else if (clean === 'EID2026') {
      const discount = Math.round(cartSubtotal * 0.15);
      setDiscountCode(clean);
      setDiscountAmount(discount);
      addToast(`Coupon "${clean}" applied: 15% Eid special discount!`, 'success');
      return true;
    }
    return false;
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setRecentOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    setDiscountAmount(0);
    setDiscountCode('');
    // refresh catalog stock
    loadCatalog();
    addToast(`Order ${newOrder.id} placed successfully!`, 'success');
  };

  const wishlistedProducts = useMemo(() => {
    return allProducts.filter((p) => wishlistIds.includes(p.id));
  }, [allProducts, wishlistIds]);

  return (
    <div className="min-h-screen bg-[#FBF9F8] text-[#111111] flex flex-col font-sans">
      
      {/* Header */}
      <Header
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        isAdmin={isAdmin}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('best-selling');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        allProducts={allProducts}
        onSelectProduct={(p) => setSelectedProduct(p)}
        currentUser={
          user
            ? {
                name: user.full_name,
                phone: user.phone,
                email: user.email,
              }
            : null
        }
      />

      <main className="w-full flex-1">
        {/* Hero Section */}
        <Hero
          onBuySpotlight={(product) => {
            handleAddToCart(product, 1);
            setCartOpen(true);
          }}
          onSelectProduct={(product) => setSelectedProduct(product)}
        />

        {/* Quick Category Filter Pills & Live BD Hub Status */}
        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            const el = document.getElementById('best-selling');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalProductsCount={allProducts.length}
        />

        {/* Section: Shop By Category */}
        <CategoryGrid
          onSelectCategory={(categoryKey) => {
            setActiveCategory(categoryKey);
          }}
        />

        {/* Section: Best Selling Products Grid */}
        <ProductGrid
          products={filteredProducts}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={(product) => handleAddToCart(product, 1)}
          onSelectProduct={(product) => setSelectedProduct(product)}
          activeCategory={activeCategory}
          onResetFilter={() => {
            setActiveCategory('all');
            setSearchQuery('');
          }}
        />

        {/* Section: Promotional Lifestyle Banners */}
        <LifestyleBanners
          onSelectCategory={(categoryKey) => {
            setActiveCategory(categoryKey);
          }}
        />

        {/* Section: Why Choose ZenMart */}
        <WhyChooseUs />

        {/* Section: Customer Reviews */}
        <CustomerReviews />

        {/* Section: Newsletter */}
        <Newsletter onNotify={(msg) => addToast(msg, 'success')} />
      </main>

      {/* Footer */}
      <Footer
        onOpenOrderTrack={() => setOrderTrackOpen(true)}
        onOpenAdmin={() => {
          if (isAdmin || isSuperAdmin) {
            setAdminOpen(true);
          } else {
            setAuthOpen(true);
            addToast('Please sign in with your Administrator account to access the Control Hub.', 'info');
          }
        }}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('best-selling');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenPolicy={(title, content) => setPolicyModal({ isOpen: true, title, content })}
      />

      {/* Modals & Slide-out Drawers */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        discountCode={discountCode}
        onApplyDiscount={handleApplyDiscount}
        discountAmount={discountAmount}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cartItems}
        discountAmount={discountAmount}
        discountCode={discountCode}
        onOrderSuccess={handleOrderSuccess}
        onShowOrderTracking={(orderId) => {
          setCheckoutOpen(false);
          setTrackingOrderNumber(orderId);
          setOrderTrackOpen(true);
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={(prod) => handleToggleWishlist(prod)}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        products={wishlistedProducts}
        onRemove={(prod) => handleToggleWishlist(prod)}
        onMoveToCart={(prod) => {
          handleAddToCart(prod, 1);
          handleToggleWishlist(prod);
        }}
      />

      <OrderTrackModal
        isOpen={orderTrackOpen}
        onClose={() => {
          setOrderTrackOpen(false);
          setTrackingOrderNumber('');
        }}
        recentOrders={recentOrders}
        initialOrderNumber={trackingOrderNumber}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onOpenAdmin={() => setAdminOpen(true)}
        onShowToast={addToast}
      />

      <PolicyModal
        isOpen={policyModal.isOpen}
        onClose={() => setPolicyModal({ isOpen: false, title: '', content: '' })}
        title={policyModal.title}
        content={policyModal.content}
      />

      {/* Full-featured Admin Dashboard */}
      {adminOpen && (
        <ErrorBoundary
          fallbackTitle="ZenMart Admin Dashboard Notice"
          onReset={() => setAdminOpen(false)}
        >
          <AdminDashboard
            onBackToStore={() => setAdminOpen(false)}
            onClose={() => setAdminOpen(false)}
            products={allProducts}
            categories={categoriesList}
            orders={recentOrders}
            inventory={inventoryList}
            onRefreshData={loadCatalog}
            onProductsUpdated={loadCatalog}
            onShowToast={addToast}
          />
        </ErrorBoundary>
      )}

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="ZenMart Storefront Notice">
      <AuthProvider>
        <ZenMartStore />
      </AuthProvider>
    </ErrorBoundary>
  );
}
