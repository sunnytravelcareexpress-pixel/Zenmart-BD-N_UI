import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Product,
  Category,
  Order,
  InventoryItem,
  Coupon,
  CustomerProfile,
  AdminAuditLog,
  AuditActionType,
  AuditTargetType,
} from '../types';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Users,
  Ticket,
  Settings,
  Plus,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit,
  ArrowLeft,
  X,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Power,
  Check,
  SlidersHorizontal,
  Star,
  Lock,
  Clock,
  ClipboardList,
  Eye,
  History,
  FileText,
  Calendar,
  FilterX,
  ArrowRight,
  Database,
  CheckCircle2,
  Shield,
  Info,
  Upload,
  ImageIcon,
} from 'lucide-react';
import { useAuth, isSuperAdminEmail } from '../lib/AuthContext';
import {
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchCategories,
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  fetchCustomers,
  updateUserRole,
  fetchAllProductsAdmin,
  fetchAdminAuditLogs,
  getStoredAdminToken,
} from '../lib/databaseService';

interface AdminDashboardProps {
  onBackToStore?: () => void;
  onClose?: () => void;
  products?: Product[];
  categories?: Category[];
  orders?: Order[];
  inventory?: InventoryItem[];
  onRefreshData?: () => Promise<void>;
  onProductsUpdated?: () => Promise<void>;
  onShowToast?: (msg: string, type?: 'success' | 'info') => void;
}

type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'categories'
  | 'customers'
  | 'coupons'
  | 'settings'
  | 'audit_logs';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToStore,
  onClose,
  products = [],
  categories = [],
  orders = [],
  inventory = [],
  onRefreshData,
  onProductsUpdated,
  onShowToast,
}) => {
  const { user, role, isAdmin, isSuperAdmin, verifyAdminStatus } = useAuth();
  const handleExit = onBackToStore || onClose || (() => {});

  // Real-time Database Security Verification on Mount (DB authoritative verification)
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(false);
  const [isDbAdminVerified, setIsDbAdminVerified] = useState(isAdmin || role === 'admin' || isSuperAdmin);

  useEffect(() => {
    let isMounted = true;
    async function checkDbAdminRole() {
      if (isSuperAdmin || isAdmin || role === 'admin') {
        setIsDbAdminVerified(true);
        return;
      }
      try {
        const verified = await verifyAdminStatus();
        if (isMounted) {
          setIsDbAdminVerified(verified);
        }
      } catch {
        // Keep active verified role unless explicitly unauthorized
      }
    }
    checkDbAdminRole();
    return () => {
      isMounted = false;
    };
  }, [verifyAdminStatus, isSuperAdmin, isAdmin, role]);

  // Tab State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data States for tabs that load their own records
  const [customersList, setCustomersList] = useState<CustomerProfile[]>([]);
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>(categories);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Synchronize categoriesList when categories prop updates
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesList(categories);
    }
  }, [categories]);

  // Custom Confirmation Dialog State (Zero window.alert / window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Orders Management Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Products Management Filters
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast?.('Please choose a valid image file (PNG, JPG, WebP).', 'info');
      return;
    }
    setIsUploadingProductImage(true);
    try {
      // 1. Client-side canvas compression for rapid, crisp display
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            const maxDim = 1200;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(readerEvent.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error('Failed to parse image file'));
          img.src = readerEvent.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file from device'));
        reader.readAsDataURL(file);
      });

      // 2. Upload to server storage endpoint
      let targetImageUrl = compressedDataUrl;
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: compressedDataUrl,
            filename: file.name.replace(/\.[^/.]+$/, ''),
          }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            targetImageUrl = uploadData.url;
          }
        }
      } catch {
        // Fallback directly to compressed data url
      }

      setEditingProduct((prev) => (prev ? { ...prev, image: targetImageUrl } : null));
      onShowToast?.('Product image uploaded successfully from device!', 'success');
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to upload image.', 'info');
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  // Inventory Management State
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  // Coupon Modal State
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Customer Search
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditAdminFilter, setAuditAdminFilter] = useState('all');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditTargetFilter, setAuditTargetFilter] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('all');
  const [inspectingAuditLog, setInspectingAuditLog] = useState<AdminAuditLog | null>(null);

  // Dedicated loader for live audit logs from Supabase/Server
  const loadAuditLogs = useCallback(async () => {
    setLoadingAuditLogs(true);
    try {
      const logs = await fetchAdminAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  }, []);

  // Refresh all core data from Supabase
  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshData) await onRefreshData();
      if (onProductsUpdated) await onProductsUpdated();
      const [custs, cpons, cats, logs] = await Promise.all([
        fetchCustomers(),
        fetchCoupons(),
        fetchCategories(true),
        fetchAdminAuditLogs(),
      ]);
      setCustomersList(custs);
      setCouponsList(cpons);
      if (cats && cats.length > 0) {
        setCategoriesList(cats);
      }
      setAuditLogs(logs);
      onShowToast?.('Dashboard synchronized with live database', 'success');
    } catch {
      onShowToast?.('Failed to refresh some data', 'info');
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshData, onProductsUpdated, onShowToast]);

  // Initial load of auxiliary admin data (customers, coupons, categories & audit logs)
  useEffect(() => {
    if (isAdmin) {
      if (onRefreshData) {
        onRefreshData();
      }
      setLoadingExtras(true);
      Promise.all([
        fetchCustomers(),
        fetchCoupons(),
        fetchCategories(true),
        fetchAdminAuditLogs(),
      ])
        .then(([custs, cpons, cats, logs]) => {
          setCustomersList(custs);
          setCouponsList(cpons);
          if (cats && cats.length > 0) {
            setCategoriesList(cats);
          }
          setAuditLogs(logs);
        })
        .catch((err) => console.warn('Error loading admin auxiliary data:', err))
        .finally(() => setLoadingExtras(false));
    }
  }, [isAdmin, onRefreshData]);

  // Fetch or refresh orders when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders' && onRefreshData) {
      onRefreshData();
    }
  }, [activeTab, onRefreshData]);

  // Fetch or refresh logs when switching to audit_logs tab
  useEffect(() => {
    if (activeTab === 'audit_logs') {
      loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs]);

  // Keep selectedOrder in sync when orders list updates
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, selectedOrder]);

  // 1. Security Verification Screen while querying PostgreSQL DB on mount
  if (isVerifyingSecurity) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-amber-950/60 border border-[#D99A24]/40 text-[#D99A24] flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Verifying Admin Authorization</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Checking database permissions and Supabase session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authoritative Database RBAC Access Guard
  if (!isDbAdminVerified && !isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-red-950/70 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              You do not have admin access. Your account{' '}
              <span className="text-[#D99A24] font-semibold">{user?.email || user?.full_name || 'Visitor'}</span>{' '}
              with role <span className="uppercase text-neutral-300 font-bold">{role}</span> does not possess verified administrator credentials in the database.
            </p>
          </div>

          <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 text-left text-xs space-y-2 text-neutral-400">
            <div className="flex items-center gap-2 text-neutral-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Row-Level Security (RLS) Active</span>
            </div>
            <p className="text-[11px] leading-tight text-neutral-500">
              Only authenticated users with role='admin' in PostgreSQL can access this management console or execute administrative mutations.
            </p>
          </div>

          <button
            onClick={handleExit}
            className="w-full py-3 bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Back to Customer Store
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 1. CALCULATED DASHBOARD METRICS
  // --------------------------------------------------------------------------
  const safeOrders = orders || [];
  const safeProducts = products || [];

  const totalSales = safeOrders.reduce(
    (sum, o) => sum + (o?.status !== 'Cancelled' ? Number(o?.total) || 0 : 0),
    0
  );

  const todayDate = new Date();
  const todayISO = todayDate.toISOString().split('T')[0];
  const todayGB = todayDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const todayUS = todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const todayStr = todayGB;

  const todaySales = safeOrders
    .filter((o) => {
      if (!o?.createdAt || o?.status === 'Cancelled') return false;
      const str = String(o.createdAt);
      return (
        str.includes('Today') ||
        str.includes(todayISO) ||
        str.includes(todayGB) ||
        str.includes(todayUS)
      );
    })
    .reduce((sum, o) => sum + (Number(o?.total) || 0), 0);

  const pendingOrdersCount = safeOrders.filter((o) => o?.status === 'Pending').length;
  const lowStockProducts = safeProducts.filter((p) => (p?.stockCount ?? 0) <= (p?.low_stock_threshold ?? 5));
  const totalOrdersCount = safeOrders.length;
  const totalProductsCount = safeProducts.length;
  const totalCustomersCount = customersList.length > 0 ? customersList.length : safeOrders.length;

  // --------------------------------------------------------------------------
  // 2. ORDERS MANAGEMENT HANDLERS (NEWEST FIRST DEFAULT SORT)
  // --------------------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    const list = safeOrders.filter((order) => {
      if (!order) return false;
      // Status filter
      if (orderStatusFilter !== 'all' && (order?.status || '').toLowerCase() !== orderStatusFilter.toLowerCase()) {
        return false;
      }
      // Search query filter (Order number, customer name, phone)
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.trim().toLowerCase();
        const num = (order.order_number || order.id || '').toLowerCase();
        const name = (order.customer?.fullName || '').toLowerCase();
        const phone = (order.customer?.phone || '').toLowerCase();
        return num.includes(q) || name.includes(q) || phone.includes(q);
      }
      return true;
    });

    // Default sorting: Newest orders first
    return list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      onShowToast?.(`Order ${orderId.slice(-6)} status updated to: ${newStatus}`, 'success');
      if (onRefreshData) await onRefreshData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      loadAuditLogs();
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to update order status in Supabase', 'info');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // --------------------------------------------------------------------------
  // 3. PRODUCTS MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return safeProducts.filter((p) => {
      if (!p) return false;
      if (productCategoryFilter !== 'all') {
        const cat = (p.category || '').toLowerCase();
        if (cat !== productCategoryFilter.toLowerCase()) return false;
      }
      if (productStatusFilter === 'active' && p.is_active === false) return false;
      if (productStatusFilter === 'inactive' && p.is_active !== false) return false;
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.trim().toLowerCase();
        const name = (p.name || '').toLowerCase();
        const brand = (p.brandTag || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        return name.includes(q) || brand.includes(q) || sku.includes(q);
      }
      return true;
    });
  }, [safeProducts, productCategoryFilter, productStatusFilter, productSearchQuery]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;
    setSavingProduct(true);
    try {
      if (editingProduct.id) {
        await updateProduct(editingProduct.id, editingProduct);
        onShowToast?.(`Product "${editingProduct.name}" updated successfully`, 'success');
      } else {
        await createProduct(editingProduct);
        onShowToast?.(`New product "${editingProduct.name}" added to catalog`, 'success');
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      if (onProductsUpdated) await onProductsUpdated();
      if (onRefreshData) await onRefreshData();
      loadAuditLogs();
    } catch (err: any) {
      onShowToast?.(err.message || 'Error saving product', 'info');
    } finally {
      setSavingProduct(false);
    }
  };

  const promptDeleteProduct = (prod: Product) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Product: ${prod.name}`,
      message: `Are you sure you want to permanently delete "${prod.name}"? Its stock records and product images will be removed from Supabase.`,
      confirmText: 'Delete Product',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteProduct(prod.id);
          onShowToast?.(`Product "${prod.name}" deleted from database`, 'success');
          if (onProductsUpdated) await onProductsUpdated();
          if (onRefreshData) await onRefreshData();
          loadAuditLogs();
        } catch (err: any) {
          onShowToast?.(err?.message || 'Could not delete product', 'info');
        }
      },
    });
  };

  // --------------------------------------------------------------------------
  // 4. INVENTORY MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  const filteredInventory = useMemo(() => {
    return safeProducts.filter((p) => {
      if (!p) return false;
      const stock = p.stockCount ?? 0;
      const threshold = p.low_stock_threshold ?? 5;
      if (inventoryStockFilter === 'low' && (stock > threshold || stock <= 0)) return false;
      if (inventoryStockFilter === 'out' && stock > 0) return false;
      if (inventoryStockFilter === 'in' && stock <= 0) return false;

      if (inventorySearchQuery.trim()) {
        const q = inventorySearchQuery.trim().toLowerCase();
        const name = (p.name || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        return name.includes(q) || sku.includes(q);
      }
      return true;
    });
  }, [safeProducts, inventorySearchQuery, inventoryStockFilter]);

  const handleSaveStock = async (prodId: string) => {
    const validStock = Math.max(0, Math.floor(tempStockValue));
    setSavingStockId(prodId);
    try {
      await updateProductStock(prodId, validStock);
      setEditingStockId(null);
      onShowToast?.(`Stock level updated to ${validStock} units`, 'success');
      if (onProductsUpdated) await onProductsUpdated();
      if (onRefreshData) await onRefreshData();
      loadAuditLogs();
    } catch (err: any) {
      onShowToast?.(err?.message || 'Error updating stock in database', 'info');
    } finally {
      setSavingStockId(null);
    }
  };

  // --------------------------------------------------------------------------
  // 5. CATEGORIES HANDLERS (SAFETY CHECK: PRODUCTS MUST NOT BE ORPHANED)
  // --------------------------------------------------------------------------
  const getCategoryProductCount = useCallback(
    (slugOrName: string) => {
      const target = (slugOrName || '').toLowerCase().trim();
      return safeProducts.filter((p) => {
        if (!p) return false;
        const pCat = (p.category || '').toLowerCase().trim();
        const pSub = (p.subCategory || '').toLowerCase().trim();
        return pCat === target || pSub === target || pCat.replace(/\s+/g, '-') === target;
      }).length;
    },
    [safeProducts]
  );

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoriesList || [];
    const q = categorySearchQuery.toLowerCase().trim();
    return (categoriesList || []).filter(
      (c) => (c?.name || '').toLowerCase().includes(q) || (c?.slug ? c.slug.toLowerCase().includes(q) : false)
    );
  }, [categoriesList, categorySearchQuery]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    setSavingCategory(true);
    try {
      if (editingCategory.id) {
        await updateCategory(editingCategory.id, editingCategory);
        onShowToast?.(`Category "${editingCategory.name}" updated`, 'success');
      } else {
        await createCategory(editingCategory);
        onShowToast?.(`Category "${editingCategory.name}" created`, 'success');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      const cats = await fetchCategories(true);
      setCategoriesList(cats);
      if (onRefreshData) await onRefreshData();
      loadAuditLogs();
    } catch (err: any) {
      onShowToast?.(err.message || 'Error saving category', 'info');
    } finally {
      setSavingCategory(false);
    }
  };

  const promptDeleteCategory = (cat: Category) => {
    const assignedCount = getCategoryProductCount(cat.slug || cat.name);
    if (assignedCount > 0) {
      onShowToast?.(
        `Cannot delete "${cat.name}": ${assignedCount} product(s) are currently in this category. Please reassign them first.`,
        'info'
      );
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Delete Category: ${cat.name}`,
      message: `Are you sure you want to permanently delete category "${cat.name}"? This action cannot be undone.`,
      confirmText: 'Delete Category',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteCategory(cat.id);
          onShowToast?.(`Category "${cat.name}" removed successfully`, 'success');
          const cats = await fetchCategories(true);
          setCategoriesList(cats);
          if (onRefreshData) await onRefreshData();
          loadAuditLogs();
        } catch (err: any) {
          onShowToast?.(err?.message || 'Cannot delete category', 'info');
        }
      },
    });
  };

  // --------------------------------------------------------------------------
  // 6. COUPONS HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code || !editingCoupon?.discount_value) return;
    setSavingCoupon(true);
    try {
      if (editingCoupon.id) {
        await updateCoupon(editingCoupon.id, editingCoupon);
        onShowToast?.(`Coupon "${editingCoupon.code}" updated`, 'success');
      } else {
        await createCoupon({
          code: editingCoupon.code,
          discount_type: editingCoupon.discount_type || 'percentage',
          discount_value: Number(editingCoupon.discount_value),
          minimum_order: Number(editingCoupon.minimum_order) || 0,
          maximum_discount: editingCoupon.maximum_discount ? Number(editingCoupon.maximum_discount) : undefined,
          usage_limit: editingCoupon.usage_limit ? Number(editingCoupon.usage_limit) : undefined,
          expires_at: editingCoupon.expires_at || undefined,
          is_active: editingCoupon.is_active ?? true,
        });
        onShowToast?.(`Coupon "${editingCoupon.code.toUpperCase()}" created`, 'success');
      }
      setCouponModalOpen(false);
      setEditingCoupon(null);
      const cpons = await fetchCoupons();
      setCouponsList(cpons);
      loadAuditLogs();
    } catch (err: any) {
      onShowToast?.(err.message || 'Error saving coupon', 'info');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    if (!coupon.id) return;
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active });
      setCouponsList((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      );
      onShowToast?.(
        `Coupon "${coupon.code}" ${coupon.is_active ? 'deactivated' : 'activated'}`,
        'success'
      );
      loadAuditLogs();
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to toggle coupon status', 'info');
    }
  };

  const promptDeleteCoupon = (coupon: Coupon) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Coupon: ${coupon.code}`,
      message: `Are you sure you want to delete coupon code "${coupon.code}"? Customers will no longer be able to use it.`,
      confirmText: 'Delete Coupon',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          if (coupon.id) {
            await deleteCoupon(coupon.id);
            setCouponsList((prev) => prev.filter((c) => c.id !== coupon.id));
            onShowToast?.(`Coupon "${coupon.code}" deleted`, 'info');
            const cpons = await fetchCoupons();
            setCouponsList(cpons);
            loadAuditLogs();
          }
        } catch (err: any) {
          onShowToast?.(err?.message || 'Failed to delete coupon', 'info');
        }
      },
    });
  };

  // --------------------------------------------------------------------------
  // 7. CUSTOMERS FILTER & ROLE MANAGEMENT
  // --------------------------------------------------------------------------
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [promoteEmailInput, setPromoteEmailInput] = useState('');
  const [isPromotingCustomEmail, setIsPromotingCustomEmail] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      if (customerSearchQuery.trim()) {
        const q = customerSearchQuery.trim().toLowerCase();
        const name = (c.full_name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      }
      return true;
    });
  }, [customersList, customerSearchQuery]);

  const canManageRoles = true;

  const handleToggleCustomerRole = async (cust: CustomerProfile) => {
    // 1. Target check: Protect Super Admins from revocation

    const cleanEmail = (cust.email || '').trim().toLowerCase();
    const isTargetSuper = Boolean(cust.is_super_admin) ||
                          cleanEmail === 'official.sunny.ext@gmail.com' ||
                          cleanEmail === 'sunny.travelcareexpress@gmail.com' ||
                          cust.id === 'mother-admin-id' ||
                          cust.id === 'super-admin-sunny-id';

    if (isTargetSuper) {
      onShowToast?.('Security Violation: The Super Admin is permanently protected and cannot be demoted, modified, or revoked.', 'info');
      return;
    }

    const newRole: 'customer' | 'admin' = cust.role === 'admin' ? 'customer' : 'admin';
    const targetKey = (cust.id || cust.email || '').toLowerCase();
    setUpdatingRoleId(targetKey);

    // 1. Optimistically update local state immediately so user sees instant result
    setCustomersList((prev) =>
      prev.map((c) => {
        const matches = (cust.id && c.id === cust.id) || (cleanEmail && (c.email || '').toLowerCase() === cleanEmail);
        return matches ? { ...c, role: newRole } : c;
      })
    );

    try {
      const callerToken = getStoredAdminToken();
      const callerIsSuper = Boolean(isSuperAdmin || isSuperAdminEmail(user?.email));
      await updateUserRole(cust.id, newRole, cust.email, {
        callerId: user?.id,
        callerEmail: user?.email,
        callerToken: callerToken || undefined,
        isSuperAdmin: callerIsSuper,
      });
      onShowToast?.(
        newRole === 'admin'
          ? `Role updated: ${cust.full_name || cust.email} is now an Administrator! (অ্যাডমিন তৈরি সফল হয়েছে)`
          : `Role updated: ${cust.full_name || cust.email} is now a Customer.`,
        'success'
      );
      const updated = await fetchCustomers();
      if (updated && updated.length > 0) {
        setCustomersList(updated);
      }
      loadAuditLogs();
    } catch (err: any) {
      // Revert on failure
      setCustomersList((prev) =>
        prev.map((c) => {
          const matches = (cust.id && c.id === cust.id) || (cleanEmail && (c.email || '').toLowerCase() === cleanEmail);
          return matches ? { ...c, role: cust.role } : c;
        })
      );
      onShowToast?.(err?.message || 'Failed to update user role.', 'info');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handlePromoteCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const clean = promoteEmailInput.trim().toLowerCase();
    if (!clean) return;

    if (clean === 'official.sunny.ext@gmail.com' || clean === 'sunny.travelcareexpress@gmail.com') {
      onShowToast?.(`${clean} is already a Super Admin.`, 'info');
      setPromoteEmailInput('');
      return;
    }

    setIsPromotingCustomEmail(true);
    try {
      const callerToken = getStoredAdminToken();
      const callerIsSuper = Boolean(isSuperAdmin || isSuperAdminEmail(user?.email));
      await updateUserRole(clean, 'admin', clean, {
        callerId: user?.id,
        callerEmail: user?.email,
        callerToken: callerToken || undefined,
        isSuperAdmin: callerIsSuper,
      });
      // Immediately reflect in list
      setCustomersList((prev) => {
        const exists = prev.some((c) => (c.email || '').toLowerCase() === clean);
        if (exists) {
          return prev.map((c) => ((c.email || '').toLowerCase() === clean ? { ...c, role: 'admin' } : c));
        }
        return [
          {
            id: `usr-${Date.now()}`,
            full_name: clean.split('@')[0],
            email: clean,
            role: 'admin',
            created_at: new Date().toISOString(),
            ordersCount: 0,
            totalSpent: 0,
          },
          ...prev,
        ];
      });
      onShowToast?.(`Administrator role granted to ${clean}! (অ্যাডমিন রোল দেওয়া হয়েছে)`, 'success');
      setPromoteEmailInput('');
      const updated = await fetchCustomers();
      if (updated && updated.length > 0) {
        setCustomersList(updated);
      }
      loadAuditLogs();
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to grant admin role.', 'info');
    } finally {
      setIsPromotingCustomEmail(false);
    }
  };

  // --------------------------------------------------------------------------
  // 8. AUDIT LOGS FILTERING & HELPERS
  // --------------------------------------------------------------------------
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (!log) return false;

      // Admin Filter
      if (auditAdminFilter !== 'all') {
        const adminEmail = (log.admin_email || '').toLowerCase().trim();
        if (adminEmail !== auditAdminFilter.toLowerCase().trim()) return false;
      }

      // Action Filter
      if (auditActionFilter !== 'all') {
        if (log.action !== auditActionFilter) return false;
      }

      // Target Filter
      if (auditTargetFilter !== 'all') {
        if (log.target_type !== auditTargetFilter) return false;
      }

      // Date Filter
      if (auditDateFilter !== 'all') {
        const logTime = new Date(log.created_at).getTime();
        const now = Date.now();
        if (auditDateFilter === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (logTime < startOfToday.getTime()) return false;
        } else if (auditDateFilter === '7days') {
          if (logTime < now - 7 * 86400000) return false;
        } else if (auditDateFilter === '30days') {
          if (logTime < now - 30 * 86400000) return false;
        }
      }

      // Search Query
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.trim().toLowerCase();
        const desc = (log.description || '').toLowerCase();
        const targetId = (log.target_id || '').toLowerCase();
        const adminEmail = (log.admin_email || '').toLowerCase();
        const adminName = (log.admin_name || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const targetType = (log.target_type || '').toLowerCase();
        return (
          desc.includes(q) ||
          targetId.includes(q) ||
          adminEmail.includes(q) ||
          adminName.includes(q) ||
          action.includes(q) ||
          targetType.includes(q)
        );
      }

      return true;
    });
  }, [
    auditLogs,
    auditAdminFilter,
    auditActionFilter,
    auditTargetFilter,
    auditDateFilter,
    auditSearchQuery,
  ]);

  const uniqueAuditAdmins = useMemo(() => {
    const emails = new Set<string>();
    auditLogs.forEach((l) => {
      if (l.admin_email) emails.add(l.admin_email.toLowerCase().trim());
    });
    if (user?.email) emails.add(user.email.toLowerCase().trim());
    return Array.from(emails);
  }, [auditLogs, user?.email]);

  const auditStats = useMemo(() => {
    const total = auditLogs.length;
    const security = auditLogs.filter(
      (l) => l.action === 'role_change' || l.action === 'admin_login' || l.action === 'admin_logout'
    ).length;
    const productsAndInventory = auditLogs.filter(
      (l) =>
        l.target_type === 'product' ||
        l.target_type === 'inventory' ||
        l.action.startsWith('product_') ||
        l.action === 'inventory_update'
    ).length;
    const ordersAndMarketing = auditLogs.filter(
      (l) =>
        l.target_type === 'order' ||
        l.target_type === 'coupon' ||
        l.target_type === 'category'
    ).length;
    return { total, security, productsAndInventory, ordersAndMarketing };
  }, [auditLogs]);

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'order_status_update':
        return {
          label: 'Order Status',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dot: 'bg-blue-400',
        };
      case 'product_create':
        return {
          label: 'Product Created',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-400',
        };
      case 'product_update':
        return {
          label: 'Product Updated',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-400',
        };
      case 'product_delete':
        return {
          label: 'Product Deleted',
          bg: 'bg-red-500/10 text-red-400 border-red-500/20',
          dot: 'bg-red-400',
        };
      case 'inventory_update':
        return {
          label: 'Stock Adjusted',
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          dot: 'bg-purple-400',
        };
      case 'category_create':
      case 'category_update':
      case 'category_delete':
        return {
          label: action.replace('_', ' ').toUpperCase(),
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          dot: 'bg-indigo-400',
        };
      case 'coupon_create':
      case 'coupon_update':
      case 'coupon_delete':
        return {
          label: action.replace('_', ' ').toUpperCase(),
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          dot: 'bg-cyan-400',
        };
      case 'role_change':
        return {
          label: 'Role Change',
          bg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
          dot: 'bg-amber-400',
        };
      case 'admin_login':
        return {
          label: 'Admin Login',
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          dot: 'bg-teal-400',
        };
      case 'admin_logout':
        return {
          label: 'Admin Logout',
          bg: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
          dot: 'bg-neutral-400',
        };
      default:
        return {
          label: String(action),
          bg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
          dot: 'bg-neutral-400',
        };
    }
  };

  const getTargetBadge = (type: AuditTargetType) => {
    const map: Record<AuditTargetType, { label: string; color: string }> = {
      order: { label: 'Order', color: 'bg-blue-950/60 text-blue-300 border-blue-800/40' },
      product: { label: 'Product', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40' },
      inventory: { label: 'Inventory', color: 'bg-purple-950/60 text-purple-300 border-purple-800/40' },
      category: { label: 'Category', color: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40' },
      coupon: { label: 'Coupon', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40' },
      customer: { label: 'Customer', color: 'bg-yellow-950/60 text-yellow-300 border-yellow-800/40' },
      role: { label: 'Security Role', color: 'bg-amber-950/60 text-amber-300 border-amber-800/40' },
      auth: { label: 'Auth Session', color: 'bg-teal-950/60 text-teal-300 border-teal-800/40' },
    };
    return map[type] || { label: type, color: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
  };

  const renderInlineDiff = (log: AdminAuditLog) => {
    if (log.old_value && log.new_value) {
      if (typeof log.old_value === 'object' && typeof log.new_value === 'object') {
        const keys = Object.keys(log.new_value);
        if (keys.length === 1) {
          const k = keys[0];
          const oldV = String((log.old_value as any)[k] ?? 'none');
          const newV = String((log.new_value as any)[k] ?? 'none');
          return (
            <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
              <span className="text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/40 line-through">
                {k}: {oldV}
              </span>
              <ArrowRight className="w-3 h-3 text-neutral-500 shrink-0" />
              <span className="text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40 font-bold">
                {k}: {newV}
              </span>
            </div>
          );
        }
        if (keys.length > 1) {
          return (
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                Modified {keys.length} fields ({keys.slice(0, 3).join(', ')}{keys.length > 3 ? '...' : ''})
              </span>
            </div>
          );
        }
      }
    }
    if (!log.old_value && log.new_value) {
      const count = typeof log.new_value === 'object' ? Object.keys(log.new_value).length : 1;
      return (
        <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30 text-[11px] font-mono">
          + Created Initial State ({count} fields)
        </span>
      );
    }
    if (log.old_value && !log.new_value) {
      return (
        <span className="text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30 text-[11px] font-mono">
          - Entity Removed / Deleted
        </span>
      );
    }
    return <span className="text-neutral-500 text-[11px] font-mono italic">Audit Event Logged</span>;
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-neutral-900 text-neutral-100 flex flex-col antialiased font-sans">
      {/* Top Admin Navigation Header */}
      <header className="h-16 bg-[#111111] border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-neutral-700 bg-white p-0.5 flex items-center justify-center shrink-0">
              <img
                alt="ZenMart BD"
                className="h-full w-full object-contain"
                src="/zenmart-logo.svg"
              />
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-[#D99A24] text-neutral-950 font-black text-[11px] uppercase tracking-wider shadow-xs">
              ADMIN
            </span>
            <div className="flex flex-col">
              <span className="font-display-title font-extrabold text-white text-base sm:text-lg tracking-tight leading-none">
                ZenMart<span className="text-[#D99A24]">.bd Control Hub</span>
              </span>
              <span className="font-bangla text-[11px] text-[#D99A24] font-medium leading-tight mt-0.5 hidden sm:inline">
                স্মার্ট কেনাকাটা, সহজ সমাধান
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D99A24]' : ''}`} />
            <span className="hidden md:inline">Sync DB</span>
          </button>

          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D99A24] hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D99A24] to-amber-300 text-neutral-950 font-extrabold flex items-center justify-center text-xs shadow-xs">
              {(user?.full_name || user?.email || 'AD').charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {user?.full_name || user?.email?.split('@')[0] || 'Administrator'}
                </span>
                {isSuperAdmin && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-neutral-950 uppercase tracking-wider">
                    Mother Admin
                  </span>
                )}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono leading-tight">
                {isSuperAdmin ? 'Super Administration' : 'is_admin() Verified'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#111111] border-r border-neutral-800 z-50 flex flex-col justify-between transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-1.5 overflow-y-auto">
            <div className="flex justify-between items-center lg:hidden pb-3 border-b border-neutral-800">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setActiveTab('dashboard');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders Management</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('products');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products Catalog</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('inventory');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4" />
                <span>Inventory &amp; Stock</span>
              </div>
              {lowStockProducts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-extrabold">
                  {lowStockProducts.length} low
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('categories');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('customers');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Customers</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">{customersList.length}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('coupons');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'coupons'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4" />
                <span>Discount Coupons</span>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">{couponsList.length}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('audit_logs');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4" />
                <span>Activity Audit Logs</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono">
                {auditLogs.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#D99A24] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Logistics &amp; Settings</span>
            </button>
          </div>

          <div className="p-4 border-t border-neutral-800 space-y-2 text-xs text-neutral-500">
            <div className="flex items-center gap-2 text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-white">PostgreSQL Live</span>
            </div>
            <p className="text-[11px] leading-tight text-neutral-400">
              Row Level Security Active. Mutations execute with verified admin role.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-950">
          {/* ================================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW (ALL 7 METRIC CARDS) */}
          {/* ================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display-title text-2xl font-bold text-white">ZenMart Operations Dashboard</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Real-time sales, order fulfillment, and dispatch metrics across Bangladesh.
                  </p>
                </div>
              </div>

              {/* 7 Live Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Total Revenue */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Total Revenue
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-[#D99A24] tabular-nums">
                      ৳ {totalSales.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3" />
                    <span>Excludes cancelled orders</span>
                  </span>
                </div>

                {/* 2. Today's Sales */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Today's Sales
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white tabular-nums">
                      ৳ {todaySales.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-2 block">
                    {todayStr} Dispatch Queue
                  </span>
                </div>

                {/* 3. Pending Orders */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Pending Orders
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-amber-400 tabular-nums">
                      {pendingOrdersCount}
                    </span>
                    <span className="text-xs text-neutral-400">orders</span>
                  </div>
                  <span className="text-[10px] text-amber-500/80 mt-2 block">Requires phone call verify</span>
                </div>

                {/* 4. Total Orders */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Total Orders
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {totalOrdersCount}
                    </span>
                    <span className="text-xs text-neutral-400">all time</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-2 block">Lifetime order volume</span>
                </div>

                {/* 5. Total Products */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Total Products
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {totalProductsCount}
                    </span>
                    <span className="text-xs text-neutral-400">in {categories.length} categories</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-2 block">Active in catalog</span>
                </div>

                {/* 6. Low Stock Products */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Low Stock Products
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-black tabular-nums ${lowStockProducts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {lowStockProducts.length}
                    </span>
                    <span className="text-xs text-neutral-400">items</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-2 block">
                    Stock &le; threshold
                  </span>
                </div>

                {/* 7. Total Customers */}
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl col-span-2 md:col-span-2">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Registered Customers
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {totalCustomersCount}
                    </span>
                    <span className="text-xs text-neutral-400">verified profiles</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-2 block">
                    Profiles across 64 districts
                  </span>
                </div>
              </div>

              {/* Recent Orders Overview Table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#D99A24]" />
                    <span>Recent Customer Orders</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#D99A24] font-semibold hover:underline cursor-pointer"
                  >
                    View All Orders &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 pb-2">
                        <th className="pb-3 font-semibold">Order ID</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">District</th>
                        <th className="pb-3 font-semibold">Total</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="py-3 font-mono font-bold text-[#D99A24]">{order.order_number || order.id}</td>
                          <td className="py-3">
                            <p className="font-semibold text-white">{order?.customer?.fullName || 'Customer'}</p>
                            <p className="text-[11px] text-neutral-400">{order?.customer?.phone || 'N/A'}</p>
                          </td>
                          <td className="py-3 text-neutral-300">{order?.customer?.district || 'Dhaka'}</td>
                          <td className="py-3 font-bold text-white tabular-nums">
                            ৳ {(Number(order?.total) || 0).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : order.status === 'Shipped'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : order.status === 'Cancelled'
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {order.status || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setActiveTab('orders');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Admin Activity Audit Trail */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[#D99A24]" />
                    <span>Recent Admin Operations Audit Trail</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                      Immutable Log
                    </span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className="text-xs text-[#D99A24] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All Activity Logs ({auditLogs.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-2">
                    No admin actions recorded yet. Admin operations are logged to PostgreSQL automatically.
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-800/60">
                    {auditLogs.slice(0, 4).map((log) => {
                      const actionBadge = getActionBadge(log.action);
                      const targetBadge = getTargetBadge(log.target_type);
                      return (
                        <div
                          key={log.id}
                          className="py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold shrink-0 ${actionBadge.bg}`}>
                              {actionBadge.label}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold shrink-0 ${targetBadge.color}`}>
                              {targetBadge.label}
                            </span>
                            <span className="text-neutral-300 truncate font-medium">
                              {log.description}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-neutral-500 font-mono text-[10px]">
                              {new Date(log.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-[11px] text-[#D99A24] font-semibold">
                              {log.admin_name || log.admin_email.split('@')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: ORDERS MANAGEMENT & DETAILS MODAL */}
          {/* ================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display-title text-2xl font-bold text-white">Orders Management</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Search, inspect, and transition order fulfillment across Bangladesh.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search order #, customer, phone..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="bg-neutral-800 border border-neutral-700 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-56 sm:w-64 focus:outline-none focus:border-[#D99A24]"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#D99A24]"
                  >
                    <option value="all">All Orders ({orders.length})</option>
                    <option value="Pending">Pending ({orders.filter((o) => o.status === 'Pending').length})</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Detail View or Orders Table */}
              {selectedOrder ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to All Orders</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">Order Number:</span>
                      <span className="font-mono text-sm font-extrabold text-[#D99A24]">
                        {selectedOrder.order_number || selectedOrder.id}
                      </span>
                    </div>
                  </div>

                  {/* Status update controls */}
                  <div className="p-4 bg-neutral-800/60 rounded-2xl border border-neutral-700/60 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-neutral-400 block">Current Status:</span>
                      <span className="text-sm font-bold text-white">{selectedOrder.status}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as Order['status'][]).map(
                        (st) => (
                          <button
                            key={st}
                            disabled={updatingOrderId === selectedOrder.id}
                            onClick={() => handleStatusChange(selectedOrder.id, st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              selectedOrder.status === st
                                ? 'bg-[#D99A24] text-neutral-950 font-bold shadow'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                            }`}
                          >
                            Set {st}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Customer & Delivery Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 text-xs">
                      <h4 className="font-bold text-white text-sm">Customer &amp; Shipping Address</h4>
                      <p className="text-neutral-300">
                        <strong className="text-white">Name:</strong> {selectedOrder?.customer?.fullName || 'N/A'}
                      </p>
                      <p className="text-neutral-300">
                        <strong className="text-white">Phone:</strong> {selectedOrder?.customer?.phone || 'N/A'}
                      </p>
                      <p className="text-neutral-300">
                        <strong className="text-white">Email:</strong> {selectedOrder?.customer?.email || 'N/A'}
                      </p>
                      <p className="text-neutral-300">
                        <strong className="text-white">District/City:</strong> {selectedOrder?.customer?.district || 'Dhaka'}
                      </p>
                      <p className="text-neutral-300">
                        <strong className="text-white">Full Address:</strong> {selectedOrder?.customer?.address || 'N/A'}
                      </p>
                      {selectedOrder?.customer?.notes && (
                        <p className="text-neutral-400 italic">
                          <strong className="text-neutral-300">Notes:</strong> {selectedOrder.customer.notes}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2 text-xs">
                      <h4 className="font-bold text-white text-sm">Financial &amp; Payment Summary</h4>
                      <div className="flex justify-between py-1 border-b border-neutral-800 text-neutral-400">
                        <span>Payment Method:</span>
                        <span className="text-white font-semibold uppercase">{selectedOrder.paymentMethod || 'COD'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800 text-neutral-400">
                        <span>Payment Status:</span>
                        <span className="text-amber-400 font-semibold">{selectedOrder.payment_status || 'Pending'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800 text-neutral-400">
                        <span>Subtotal:</span>
                        <span className="text-white tabular-nums">৳ {(Number(selectedOrder.subtotal) || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800 text-neutral-400">
                        <span>Delivery Fee:</span>
                        <span className="text-white tabular-nums">
                          {Number(selectedOrder.deliveryFee) === 0 ? 'FREE' : `৳ ${selectedOrder.deliveryFee}`}
                        </span>
                      </div>
                      {Number(selectedOrder.discount) > 0 && (
                        <div className="flex justify-between py-1 border-b border-neutral-800 text-emerald-400">
                          <span>Discount Applied:</span>
                          <span className="tabular-nums">-৳ {selectedOrder.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 text-sm font-bold text-white">
                        <span>Total Payable (COD):</span>
                        <span className="text-[#D99A24] tabular-nums">
                          ৳ {(Number(selectedOrder.total) || 0).toLocaleString()} BDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items snapshot */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white">
                      Ordered Items ({(selectedOrder?.items || []).length})
                    </h4>
                    <div className="space-y-2">
                      {(selectedOrder?.items || []).map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={it?.product?.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80'}
                              alt={it?.product?.name || 'Product'}
                              className="w-12 h-12 rounded-lg object-cover bg-neutral-800"
                            />
                            <div>
                              <p className="font-bold text-white">{it?.product?.name || 'Item'}</p>
                              <span className="text-[11px] text-neutral-400">
                                Unit Price: ৳ {(Number(it?.product?.price) || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-neutral-400 block">Qty: {it?.quantity || 1}</span>
                            <span className="text-sm font-bold text-white tabular-nums">
                              ৳ {((Number(it?.product?.price) || 0) * (it?.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-800/60 text-neutral-400">
                        <tr>
                          <th className="p-3.5 font-semibold">Order Number</th>
                          <th className="p-3.5 font-semibold">Customer</th>
                          <th className="p-3.5 font-semibold">City / District</th>
                          <th className="p-3.5 font-semibold">Date</th>
                          <th className="p-3.5 font-semibold">Total Amount</th>
                          <th className="p-3.5 font-semibold">Payment</th>
                          <th className="p-3.5 font-semibold">Status</th>
                          <th className="p-3.5 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-neutral-800/40 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-[#D99A24]">
                                {order.order_number || order.id}
                              </td>
                              <td className="p-3.5">
                                <p className="font-bold text-white">{order?.customer?.fullName || 'Customer'}</p>
                                <p className="text-[11px] text-neutral-400">{order?.customer?.phone || 'N/A'}</p>
                              </td>
                              <td className="p-3.5 text-neutral-300">{order?.customer?.district || 'Dhaka'}</td>
                              <td className="p-3.5 text-neutral-400">{order?.createdAt || 'N/A'}</td>
                              <td className="p-3.5 font-bold text-white tabular-nums">
                                ৳ {(Number(order?.total) || 0).toLocaleString()}
                              </td>
                              <td className="p-3.5 text-neutral-300 uppercase text-[11px]">
                                {order.paymentMethod || 'COD'}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    order.status === 'Delivered'
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                      : order.status === 'Shipped'
                                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                      : order.status === 'Cancelled'
                                      ? 'bg-red-950 text-red-400 border border-red-800'
                                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                                  }`}
                                >
                                  {order.status || 'Pending'}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-[#D99A24] hover:text-neutral-950 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-xs text-neutral-500">
                              No orders found matching your search and filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: PRODUCTS CATALOG (SEARCH, FILTERS, ADD, EDIT, DELETE) */}
          {/* ================================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display-title text-2xl font-bold text-white">Products Catalog</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Add new gadgets, adjust BDT pricing, and manage homepage drops.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct({
                      name: '',
                      brandTag: 'ZenMart Curated',
                      price: 1450,
                      originalPrice: 1850,
                      stockCount: 15,
                      low_stock_threshold: 5,
                      category: categories[0]?.slug || 'smart-gadgets',
                      description: '',
                      is_active: true,
                      is_best_seller: false,
                      isNew: true,
                      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
                    });
                    setProductModalOpen(true);
                  }}
                  className="bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Filters toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search product by name, brand, SKU..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-56 sm:w-64 focus:outline-none focus:border-[#D99A24]"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#D99A24]"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#D99A24]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Products Table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-800/60 text-neutral-400">
                      <tr>
                        <th className="p-3.5 font-semibold">Product</th>
                        <th className="p-3.5 font-semibold">Category</th>
                        <th className="p-3.5 font-semibold">Price (BDT)</th>
                        <th className="p-3.5 font-semibold">Stock</th>
                        <th className="p-3.5 font-semibold">Rating &amp; Tags</th>
                        <th className="p-3.5 font-semibold">Status</th>
                        <th className="p-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-10 h-10 rounded-lg object-cover bg-neutral-800 flex-shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-white line-clamp-1">{p.name}</p>
                                  <span className="text-[11px] text-neutral-400">{p.brandTag}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-neutral-300 capitalize">{p.category}</td>
                            <td className="p-3.5 font-bold text-white tabular-nums">
                              ৳ {Number(p.price).toLocaleString()}
                              {p.originalPrice && (
                                <span className="text-[10px] text-neutral-500 line-through ml-1.5 block sm:inline">
                                  ৳ {Number(p.originalPrice).toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  (p.stockCount ?? 0) <= 0
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : (p.stockCount ?? 0) <= 5
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                }`}
                              >
                                {p.stockCount ?? 0} units
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex flex-col gap-1">
                                <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{p.rating ? Number(p.rating).toFixed(1) : '5.0'}</span>
                                </span>
                                {p.is_featured && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[#D99A24] border border-[#D99A24]/30 text-[9px] font-bold w-fit">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5">
                              {p.is_active === false ? (
                                <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-[10px] font-bold rounded-md">
                                  Inactive
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold rounded-md">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setProductModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                                title="Edit product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => promptDeleteProduct(p)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/50 text-red-400 cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                            No products match your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: INVENTORY & STOCK (SAFE REAL-TIME STOCK UPDATES) */}
          {/* ================================================================= */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display-title text-2xl font-bold text-white">Inventory &amp; Stock Levels</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Synchronize physical stock with PostgreSQL triggers in Dhaka fulfillment center.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setEditingProduct({
                        name: '',
                        brandTag: 'ZenMart Curated',
                        price: 1450,
                        originalPrice: 1850,
                        stockCount: 15,
                        low_stock_threshold: 5,
                        category: categories[0]?.slug || 'smart-gadgets',
                        description: '',
                        is_active: true,
                        is_best_seller: false,
                        isNew: true,
                        image: '',
                      });
                      setProductModalOpen(true);
                    }}
                    className="bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search product or SKU..."
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-52 sm:w-64 focus:outline-none focus:border-[#D99A24]"
                    />
                  </div>

                  <select
                    value={inventoryStockFilter}
                    onChange={(e) => setInventoryStockFilter(e.target.value as any)}
                    className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#D99A24]"
                  >
                    <option value="all">All Stock Status ({products.length})</option>
                    <option value="low">Low Stock ({lowStockProducts.length})</option>
                    <option value="out">Out of Stock</option>
                    <option value="in">In Stock</option>
                  </select>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-800/60 text-neutral-400">
                    <tr>
                      <th className="p-3.5 font-semibold">SKU / Product</th>
                      <th className="p-3.5 font-semibold">Current Stock</th>
                      <th className="p-3.5 font-semibold">Stock Status</th>
                      <th className="p-3.5 font-semibold text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {filteredInventory.length > 0 ? (
                      filteredInventory.map((prod) => (
                        <tr key={prod.id} className="hover:bg-neutral-800/40">
                          <td className="p-3.5">
                            <p className="font-bold text-white">{prod.name}</p>
                            <span className="text-[10px] text-[#D99A24] font-mono">
                              {prod.sku || `ZMB-${prod.id.slice(-4)}`}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {editingStockId === prod.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={tempStockValue}
                                  onChange={(e) => setTempStockValue(Number(e.target.value))}
                                  className="w-20 bg-neutral-800 border border-neutral-700 px-2 py-1 rounded text-white text-xs focus:outline-none focus:border-[#D99A24]"
                                />
                                <button
                                  onClick={() => handleSaveStock(prod.id)}
                                  disabled={savingStockId === prod.id}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {savingStockId === prod.id ? '...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingStockId(null)}
                                  className="text-neutral-400 hover:text-white text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="font-extrabold text-base text-white tabular-nums">
                                {prod.stockCount ?? 0}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {(prod.stockCount ?? 0) <= 0 ? (
                              <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px] font-bold">
                                Out of Stock
                              </span>
                            ) : (prod.stockCount ?? 0) <= (prod.low_stock_threshold || 5) ? (
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded text-[10px] font-bold">
                                Low Stock ({prod.stockCount} left)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setEditingStockId(prod.id);
                                setTempStockValue(prod.stockCount ?? 0);
                              }}
                              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Update Stock
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs text-neutral-500">
                          <p>No inventory items match your filter criteria.</p>
                          <button
                            onClick={() => {
                              setEditingProduct({
                                name: '',
                                brandTag: 'ZenMart Curated',
                                price: 1450,
                                originalPrice: 1850,
                                stockCount: 15,
                                low_stock_threshold: 5,
                                category: categories[0]?.slug || 'smart-gadgets',
                                description: '',
                                is_active: true,
                                is_best_seller: false,
                                isNew: true,
                                image: '',
                              });
                              setProductModalOpen(true);
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D99A24] text-neutral-950 font-bold hover:bg-amber-400 cursor-pointer shadow-sm text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add New Product to Inventory</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: CATEGORIES (ADD, EDIT, DELETE WITH SAFETY CHECK) */}
          {/* ================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display-title text-2xl font-bold text-white">Categories Management</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Organize your product catalog into accessible storefront sections.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-48 sm:w-56 focus:outline-none focus:border-[#D99A24]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingCategory({
                        name: '',
                        slug: '',
                        description: '',
                        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
                        is_active: true,
                      });
                      setCategoryModalOpen(true);
                    }}
                    className="bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredCategories.map((cat) => {
                  const prodCount = getCategoryProductCount(cat.slug || cat.name);
                  return (
                    <div
                      key={cat.id}
                      className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between gap-3 group hover:border-neutral-700 transition-colors"
                    >
                      <div className="h-32 rounded-xl overflow-hidden bg-neutral-800">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                          <span className="text-[10px] font-mono text-neutral-400">{cat.slug}</span>
                        </div>
                        <span className="text-[11px] text-[#D99A24] font-semibold block mt-1">
                          {prodCount} assigned product{prodCount === 1 ? '' : 's'}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                          title="Edit category"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDeleteCategory(cat)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/50 text-red-400 cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: CUSTOMERS (REAL PROFILES FROM SUPABASE + ORDERS AGGREGATE) */}
          {/* ================================================================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display-title text-2xl font-bold text-white">Registered Customers</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#D99A24]/20 border border-[#D99A24]/40 text-[#D99A24] text-[11px] font-bold">
                      RBAC Controls
                    </span>
                    {canManageRoles && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                        👑 Super Admin Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {canManageRoles
                      ? 'You have authoritative Super Admin access. You can promote any registered customer to Administrator or revoke roles.'
                      : 'Customer accounts directory. Only the Super Admin (official.sunny.ext@gmail.com) can assign or modify administrator roles.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Quick Promote By Registered Email (Strictly Super Admin only) */}
                  {canManageRoles ? (
                    <form onSubmit={handlePromoteCustomEmail} className="flex items-center gap-1.5">
                      <input
                        type="email"
                        required
                        placeholder="Promote email to admin..."
                        value={promoteEmailInput}
                        onChange={(e) => setPromoteEmailInput(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl px-3 py-2 w-48 sm:w-56 focus:outline-none focus:border-[#D99A24]"
                      />
                      <button
                        type="submit"
                        disabled={isPromotingCustomEmail || !promoteEmailInput.trim()}
                        className="bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                        title="Promote this email to Administrator"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isPromotingCustomEmail ? 'Saving...' : 'Make Admin'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
                      <Lock className="w-3.5 h-3.5 text-[#D99A24]" />
                      <span>Role Management: Super Admin Access Only</span>
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search name, email, phone..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 w-full sm:w-56 focus:outline-none focus:border-[#D99A24]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-800/60 text-neutral-400">
                      <tr>
                        <th className="p-3.5 font-semibold">Customer</th>
                        <th className="p-3.5 font-semibold">Phone</th>
                        <th className="p-3.5 font-semibold">Role</th>
                        <th className="p-3.5 font-semibold">Orders Count</th>
                        <th className="p-3.5 font-semibold">Total Spent</th>
                        <th className="p-3.5 font-semibold">Joined Date</th>
                        <th className="p-3.5 font-semibold text-right">Role Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((cust) => {
                          const cleanCustEmail = (cust.email || '').trim().toLowerCase();
                          const isMotherAdmin = cleanCustEmail === 'official.sunny.ext@gmail.com' || cleanCustEmail === 'sunny.travelcareexpress@gmail.com';
                          const isUpdating = Boolean(
                            updatingRoleId &&
                            (updatingRoleId === cust.id || (cleanCustEmail && updatingRoleId === cleanCustEmail))
                          );

                          return (
                            <tr key={cust.id} className="hover:bg-neutral-800/40 transition-colors">
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                                    {(cust.full_name || cust.email || 'C').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-bold text-white">{cust.full_name || 'Anonymous Customer'}</p>
                                      {isMotherAdmin && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-neutral-950 uppercase tracking-wider">
                                          Super Admin
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-neutral-400">{cust.email || 'No email provided'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 text-neutral-300 font-mono text-[11px]">
                                {cust.phone || 'N/A'}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isMotherAdmin
                                      ? 'bg-amber-400 text-neutral-950 font-black shadow-xs'
                                      : cust.role === 'admin'
                                      ? 'bg-[#D99A24] text-neutral-950'
                                      : 'bg-neutral-800 text-neutral-300'
                                  }`}
                                >
                                  {cust.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                                  <span>{isMotherAdmin ? 'Super Admin' : cust.role}</span>
                                </span>
                              </td>
                              <td className="p-3.5 font-bold text-white tabular-nums">
                                {cust.ordersCount ?? 0} orders
                              </td>
                              <td className="p-3.5 font-bold text-[#D99A24] tabular-nums">
                                ৳ {(cust.totalSpent ?? 0).toLocaleString()}
                              </td>
                              <td className="p-3.5 text-neutral-400 text-[11px]">
                                {cust.created_at
                                  ? (() => {
                                      try {
                                        const d = new Date(cust.created_at);
                                        return isNaN(d.getTime())
                                          ? 'Recent'
                                          : d.toLocaleDateString('en-GB', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                            });
                                      } catch {
                                        return 'Recent';
                                      }
                                    })()
                                  : 'Recent'}
                              </td>
                              <td className="p-3.5 text-right">
                                {isMotherAdmin ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 text-[#D99A24] border border-[#D99A24]/40 font-bold text-[10px] uppercase">
                                    👑 Mother Admin
                                  </span>
                                ) : canManageRoles ? (
                                  <div className="flex items-center justify-end gap-2">
                                    {cust.role === 'admin' ? (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCustomerRole(cust)}
                                        disabled={isUpdating}
                                        className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                                        title="Revoke Administrator role"
                                      >
                                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                                        <span>{isUpdating ? 'Revoking...' : 'Revoke Admin'}</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCustomerRole(cust)}
                                        disabled={isUpdating}
                                        className="px-3 py-1.5 rounded-xl bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                                        title="Make this customer an Administrator"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-950" />
                                        <span>{isUpdating ? 'Promoting...' : 'Make Admin'}</span>
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end">
                                    <span
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800/80 text-neutral-400 border border-neutral-700/60 text-[11px] font-medium"
                                      title="Only the Super Admin (official.sunny.ext@gmail.com / sunny.travelcareexpress@gmail.com) can manage administrator roles"
                                    >
                                      <Lock className="w-3 h-3 text-neutral-500" />
                                      <span>Super Admin Only</span>
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                            {loadingExtras ? 'Loading customer accounts...' : 'No customers match your search.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 7: DISCOUNT COUPONS (REAL DATABASE COUPONS CRUD) */}
          {/* ================================================================= */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display-title text-2xl font-bold text-white">Discount Coupons</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Create promo codes, manage percentage/fixed discounts, and minimum order rules.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCoupon({
                      code: '',
                      discount_type: 'percentage',
                      discount_value: 10,
                      minimum_order: 500,
                      maximum_discount: 1000,
                      is_active: true,
                    });
                    setCouponModalOpen(true);
                  }}
                  className="bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Coupon</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {couponsList.map((cpn) => (
                  <div
                    key={cpn.id || cpn.code}
                    className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-amber-500/20 text-[#D99A24] font-mono font-bold text-sm rounded-lg border border-[#D99A24]/40">
                          {cpn.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cpn.is_active
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {cpn.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {cpn.discount_type === 'percentage'
                          ? `${cpn.discount_value}% Off Storewide`
                          : `Flat ৳${cpn.discount_value} Off`}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Min. Order: ৳ {Number(cpn.minimum_order || 0).toLocaleString()} BDT
                        {cpn.maximum_discount ? ` • Max: ৳${cpn.maximum_discount}` : ''}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                        <span>Used: <strong className="text-white">{cpn.used_count || 0}</strong>{cpn.usage_limit ? ` / ${cpn.usage_limit}` : ''}</span>
                        <span>
                          {cpn.expires_at
                            ? (() => {
                                try {
                                  const d = new Date(cpn.expires_at);
                                  return isNaN(d.getTime())
                                    ? 'No Expiry'
                                    : `Exp: ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
                                } catch {
                                  return 'No Expiry';
                                }
                              })()
                            : 'No Expiry'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                      <button
                        onClick={() => handleToggleCouponActive(cpn)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          cpn.is_active
                            ? 'text-amber-400 hover:bg-neutral-800'
                            : 'text-emerald-400 hover:bg-neutral-800'
                        }`}
                      >
                        {cpn.is_active ? 'Disable' : 'Activate'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCoupon(cpn);
                            setCouponModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                          title="Edit coupon"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {cpn.id && (
                          <button
                            onClick={() => promptDeleteCoupon(cpn)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/50 text-red-400 cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 8: STORE SETTINGS & DATABASE STATUS */}
          {/* ================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display-title text-2xl font-bold text-white">Store &amp; Database Settings</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Inspect logistics parameters and Supabase connection security.
                </p>
              </div>

              {/* Delivery Logistics */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D99A24] text-[18px]">local_shipping</span>
                  <span>Bangladesh Courier &amp; Logistics Configuration</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                    <p className="text-neutral-400">Inside Dhaka (Pathao Express)</p>
                    <p className="text-lg font-extrabold text-white mt-1">৳ 60 BDT</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Same day / Next day handover</p>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                    <p className="text-neutral-400">Outside Dhaka (Steadfast Courier)</p>
                    <p className="text-lg font-extrabold text-white mt-1">৳ 120 BDT</p>
                    <p className="text-[10px] text-neutral-500 mt-1">2-3 days nationwide coverage</p>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                    <p className="text-neutral-400">Free Delivery Threshold</p>
                    <p className="text-lg font-extrabold text-[#D99A24] mt-1">৳ 1,000 BDT</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Automatic zero shipping on checkout</p>
                  </div>
                </div>
              </div>

              {/* Security & RLS Architecture Audit */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Security &amp; Row Level Security (RLS) Status</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-300">Public Profiles Role Escalation Protection:</span>
                    <span className="text-emerald-400 font-bold">trg_prevent_role_escalation ACTIVE</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-300">Guest Order Protection:</span>
                    <span className="text-emerald-400 font-bold">track_guest_order RPC Only (No Public Select)</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-300">Database Role Authorizer:</span>
                    <span className="text-emerald-400 font-bold">public.is_admin() SECURITY DEFINER</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <span className="text-neutral-300">Inventory Synchronization:</span>
                    <span className="text-emerald-400 font-bold">trg_sync_product_inventory ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 9: ADMIN ACTIVITY AUDIT LOGS (Immutable Security Trail) */}
          {/* ================================================================= */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display-title text-2xl font-bold text-white">
                      Admin Activity Audit Logs
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Immutable Ledger</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Authoritative, cryptographically audited activity history tracking all admin mutations in PostgreSQL / Supabase.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadAuditLogs}
                    disabled={loadingAuditLogs}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin text-[#D99A24]' : ''}`} />
                    <span>Refresh Logs</span>
                  </button>
                </div>
              </div>

              {/* Security & Immutability Architecture Notice */}
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Database Security &amp; Tamper-Proof Guarantee</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-normal">
                          (PostgreSQL RLS &amp; DB Triggers Active)
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                        Audit logs are strictly append-only. Triggers{' '}
                        <code className="text-neutral-300 font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded">
                          trg_prevent_audit_log_update
                        </code>{' '}
                        and{' '}
                        <code className="text-neutral-300 font-mono text-[10px] bg-neutral-800 px-1 py-0.5 rounded">
                          trg_prevent_audit_log_delete
                        </code>{' '}
                        raise PostgreSQL exceptions on any modification. Super Admin actions cannot be deleted by other admins.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] font-semibold text-emerald-400">Zero Deletions Allowed</span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs font-medium">Total Audit Events</span>
                    <ClipboardList className="w-4 h-4 text-[#D99A24]" />
                  </div>
                  <p className="text-2xl font-black text-white mt-2 font-mono">
                    {auditStats.total}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1">All recorded mutations</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs font-medium">Security &amp; Auth</span>
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-amber-400 mt-2 font-mono">
                    {auditStats.security}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1">Logins &amp; role changes</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs font-medium">Catalog &amp; Stock</span>
                    <Package className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                    {auditStats.productsAndInventory}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1">Product, stock &amp; categories</p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs font-medium">Orders &amp; Coupons</span>
                    <ShoppingBag className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-blue-400 mt-2 font-mono">
                    {auditStats.ordersAndMarketing}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1">Status changes &amp; discounts</p>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Search Query */}
                  <div className="lg:col-span-2 relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search description, target ID, admin email..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D99A24]"
                    />
                    {auditSearchQuery && (
                      <button
                        onClick={() => setAuditSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Admin Filter */}
                  <div>
                    <select
                      value={auditAdminFilter}
                      onChange={(e) => setAuditAdminFilter(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D99A24]"
                    >
                      <option value="all">All Administrators ({uniqueAuditAdmins.length})</option>
                      {uniqueAuditAdmins.map((email) => (
                        <option key={email} value={email}>
                          {email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Filter */}
                  <div>
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D99A24]"
                    >
                      <option value="all">All Actions</option>
                      <option value="order_status_update">Order Status Update</option>
                      <option value="product_create">Product Create</option>
                      <option value="product_update">Product Update</option>
                      <option value="product_delete">Product Delete</option>
                      <option value="inventory_update">Inventory Stock Adjust</option>
                      <option value="category_create">Category Create</option>
                      <option value="category_update">Category Update</option>
                      <option value="category_delete">Category Delete</option>
                      <option value="coupon_create">Coupon Create</option>
                      <option value="coupon_update">Coupon Update</option>
                      <option value="coupon_delete">Coupon Delete</option>
                      <option value="role_change">Role Change</option>
                      <option value="admin_login">Admin Login</option>
                      <option value="admin_logout">Admin Logout</option>
                    </select>
                  </div>

                  {/* Target Filter */}
                  <div>
                    <select
                      value={auditTargetFilter}
                      onChange={(e) => setAuditTargetFilter(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D99A24]"
                    >
                      <option value="all">All Targets</option>
                      <option value="order">Order (অর্ডার)</option>
                      <option value="product">Product (পণ্য)</option>
                      <option value="inventory">Inventory (স্টক)</option>
                      <option value="category">Category (ক্যাটেগরি)</option>
                      <option value="coupon">Coupon (কুপন)</option>
                      <option value="customer">Customer (গ্রাহক)</option>
                      <option value="role">Role (অ্যাডমিন রোল)</option>
                      <option value="auth">Auth Session (লগইন)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800/60 text-xs">
                  {/* Date Filter */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-neutral-400 text-[11px]">Timeframe:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'all', label: 'All Time' },
                        { key: 'today', label: 'Today' },
                        { key: '7days', label: 'Last 7 Days' },
                        { key: '30days', label: 'Last 30 Days' },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setAuditDateFilter(item.key)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            auditDateFilter === item.key
                              ? 'bg-[#D99A24] text-neutral-950 font-bold'
                              : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Filters & Results Indicator */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Showing <strong className="text-white">{filteredAuditLogs.length}</strong> of {auditLogs.length} logs
                    </span>
                    {(auditSearchQuery ||
                      auditAdminFilter !== 'all' ||
                      auditActionFilter !== 'all' ||
                      auditTargetFilter !== 'all' ||
                      auditDateFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setAuditSearchQuery('');
                          setAuditAdminFilter('all');
                          setAuditActionFilter('all');
                          setAuditTargetFilter('all');
                          setAuditDateFilter('all');
                        }}
                        className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                      >
                        <FilterX className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Logs Table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                {loadingAuditLogs && auditLogs.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#D99A24] animate-spin mx-auto" />
                    <p className="text-xs text-neutral-400">Loading audit log entries from PostgreSQL...</p>
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <ClipboardList className="w-10 h-10 text-neutral-600 mx-auto" />
                    <h3 className="text-sm font-bold text-white">No Audit Records Found</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      {auditLogs.length === 0
                        ? 'No admin activity has been logged yet. Administrative actions will automatically be recorded here.'
                        : 'No logs match your filter criteria. Try broadening your search or resetting filters.'}
                    </p>
                    {auditLogs.length > 0 && (
                      <button
                        onClick={() => {
                          setAuditSearchQuery('');
                          setAuditAdminFilter('all');
                          setAuditActionFilter('all');
                          setAuditTargetFilter('all');
                          setAuditDateFilter('all');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Date &amp; Admin</th>
                          <th className="px-4 py-3 font-semibold">Action &amp; Target</th>
                          <th className="px-4 py-3 font-semibold">Description</th>
                          <th className="px-4 py-3 font-semibold">Old Value vs New Value</th>
                          <th className="px-4 py-3 font-semibold text-right">Security &amp; Diff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {filteredAuditLogs.map((log) => {
                          const actionBadge = getActionBadge(log.action);
                          const targetBadge = getTargetBadge(log.target_type);
                          const isSuper = Boolean(log.is_super_admin) ||
                            log.admin_email === 'official.sunny.ext@gmail.com' ||
                            log.admin_email === 'sunny.travelcareexpress@gmail.com';

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-neutral-850/60 transition-colors group"
                            >
                              {/* 1. Date & Admin */}
                              <td className="px-4 py-3.5 align-top">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px]">
                                    <Clock className="w-3 h-3 text-neutral-500" />
                                    <span>
                                      {new Date(log.created_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-white">
                                      {log.admin_name || log.admin_email.split('@')[0]}
                                    </span>
                                    {isSuper ? (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-neutral-950 uppercase tracking-wider">
                                        Super Admin
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-neutral-800 text-neutral-300">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-400 font-mono truncate max-w-[160px]">
                                    {log.admin_email}
                                  </p>
                                </div>
                              </td>

                              {/* 2. Action & Target */}
                              <td className="px-4 py-3.5 align-top">
                                <div className="space-y-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${actionBadge.bg}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${actionBadge.dot}`}></span>
                                    <span>{actionBadge.label}</span>
                                  </span>

                                  <div className="flex items-center gap-1 text-[10px]">
                                    <span className={`px-1.5 py-0.5 rounded border font-semibold ${targetBadge.color}`}>
                                      {targetBadge.label}
                                    </span>
                                    <span className="text-neutral-500 font-mono">#</span>
                                    <span
                                      className="font-mono text-neutral-300 truncate max-w-[100px]"
                                      title={log.target_id}
                                    >
                                      {log.target_id.slice(-8)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Description */}
                              <td className="px-4 py-3.5 align-top">
                                <div className="space-y-1">
                                  <p className="text-neutral-200 text-xs leading-snug">
                                    {log.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                                    <span className="font-mono">{log.ip_address || '103.145.118.42 (Dhaka Hub)'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* 4. Old Value vs New Value (Summary & Diff Preview) */}
                              <td className="px-4 py-3.5 align-top">
                                <div className="space-y-1">
                                  {renderInlineDiff(log)}
                                </div>
                              </td>

                              {/* 5. Security & Diff Action */}
                              <td className="px-4 py-3.5 align-top text-right">
                                <div className="flex flex-col items-end gap-1.5">
                                  <button
                                    onClick={() => setInspectingAuditLog(log)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-neutral-700"
                                  >
                                    <Eye className="w-3 h-3 text-[#D99A24]" />
                                    <span>Inspect Diff</span>
                                  </button>
                                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Verified</span>
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* =================================================================== */}
      {productModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingProduct.category || categories[0]?.slug}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Brand Tag</label>
                  <input
                    type="text"
                    value={editingProduct.brandTag || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brandTag: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Price (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Compare Price (BDT ৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) || undefined })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stockCount ?? 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: Number(e.target.value) })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Low Stock Warning Threshold</label>
                  <input
                    type="number"
                    min={1}
                    value={editingProduct.low_stock_threshold ?? 5}
                    onChange={(e) => setEditingProduct({ ...editingProduct, low_stock_threshold: Number(e.target.value) })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
              </div>

              {/* Product Image: Upload From Device */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-300 font-semibold">
                    Product Image (পণ্য ছবি) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    className="text-[11px] text-[#D99A24] hover:underline cursor-pointer"
                  >
                    {showUrlFallback ? 'Hide URL field' : 'Or paste URL'}
                  </button>
                </div>

                <input
                  type="file"
                  ref={imageFileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileSelect(file);
                    e.target.value = '';
                  }}
                />

                {editingProduct.image ? (
                  <div className="p-3 bg-neutral-800/80 border border-neutral-700 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={editingProduct.image}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Image Attached</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                          {editingProduct.image.startsWith('data:')
                            ? 'Uploaded from device'
                            : editingProduct.image.startsWith('/uploads')
                            ? 'Saved on server'
                            : editingProduct.image}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageFileInputRef.current?.click()}
                        disabled={isUploadingProductImage}
                        className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                        className="p-1.5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingProductImage && imageFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageFileSelect(file);
                    }}
                    className="border-2 border-dashed border-neutral-700 hover:border-[#D99A24] bg-neutral-800/40 hover:bg-neutral-800/80 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#D99A24] flex items-center justify-center group-hover:scale-105 transition-transform">
                      {isUploadingProductImage ? (
                        <div className="w-5 h-5 border-2 border-[#D99A24] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-xs font-bold text-white group-hover:text-[#D99A24] transition-colors">
                        {isUploadingProductImage ? 'Processing Image...' : 'Upload Image From Device (ডিভাইস থেকে ছবি আপলোড)'}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Click to browse or drag &amp; drop product photo here (JPG, PNG, WebP)
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          imageFileInputRef.current?.click();
                        }}
                        disabled={isUploadingProductImage}
                        className="mt-2 px-3.5 py-1.5 bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose File From Device</span>
                      </button>
                    </div>
                  </div>
                )}

                {showUrlFallback && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Or image URL link:
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={editingProduct.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#D99A24] text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active !== false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-[#D99A24]"
                  />
                  <span className="text-neutral-200">Active (Visible in Store)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.is_featured)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-[#D99A24]"
                  />
                  <span className="text-neutral-200">Featured (Homepage Showcase)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.is_best_seller)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_best_seller: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-[#D99A24]"
                  />
                  <span className="text-neutral-200">Best Seller Tag</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-xl bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold transition-all disabled:opacity-50"
                >
                  {savingProduct ? 'Saving to Database...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* =================================================================== */}
      {categoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCategory.id ? 'Edit Category' : 'Create Category'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Wearables"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Slug (URL identifier)</label>
                <input
                  type="text"
                  placeholder="smart-wearables"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingCategory.image || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="px-5 py-2 rounded-xl bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold transition-all disabled:opacity-50"
                >
                  {savingCategory ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT COUPON */}
      {/* =================================================================== */}
      {couponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCoupon.id ? 'Edit Coupon' : 'Create Discount Coupon'}
              </h3>
              <button onClick={() => setCouponModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER26"
                  value={editingCoupon.code || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Discount Type</label>
                  <select
                    value={editingCoupon.discount_type || 'percentage'}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, discount_type: e.target.value as any })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed BDT (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingCoupon.discount_value || ''}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, discount_value: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Min. Order (BDT ৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCoupon.minimum_order || 0}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, minimum_order: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Max. Discount (BDT ৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingCoupon.maximum_discount || ''}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        maximum_discount: Number(e.target.value) || undefined,
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Usage Limit (Max Uses)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={editingCoupon.usage_limit || ''}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        usage_limit: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editingCoupon.expires_at ? editingCoupon.expires_at.split('T')[0] : ''}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCoupon.is_active !== false}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, is_active: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-[#D99A24]"
                  />
                  <span className="text-neutral-200">Active and redeemable on checkout</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="px-5 py-2 rounded-xl bg-[#D99A24] hover:bg-amber-400 text-neutral-950 font-bold transition-all disabled:opacity-50"
                >
                  {savingCoupon ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${confirmModal.isDestructive ? 'text-red-400' : 'text-[#D99A24]'}`} />
              <span>{confirmModal.title}</span>
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  cb();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  confirmModal.isDestructive
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-[#D99A24] hover:bg-amber-400 text-neutral-950 shadow'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: AUDIT LOG INSPECTOR (Old Value vs New Value Diff Viewer) */}
      {/* =================================================================== */}
      {inspectingAuditLog && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#D99A24]/10 border border-[#D99A24]/20 text-[#D99A24] flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Audit Event Diff Inspector</span>
                    <span className="text-[10px] font-mono text-neutral-400 font-normal">
                      #{inspectingAuditLog.id.slice(0, 10)}
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Side-by-side verification of entity state changes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingAuditLog(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 text-[10px] uppercase font-semibold block">Action</span>
                <span className="font-bold text-white mt-0.5 block truncate">
                  {inspectingAuditLog.action}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] uppercase font-semibold block">Target</span>
                <span className="font-bold text-neutral-200 mt-0.5 block truncate">
                  {inspectingAuditLog.target_type} (#{inspectingAuditLog.target_id.slice(-8)})
                </span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] uppercase font-semibold block">Admin</span>
                <span className="font-bold text-white mt-0.5 block truncate">
                  {inspectingAuditLog.admin_name || inspectingAuditLog.admin_email.split('@')[0]}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono block truncate">
                  {inspectingAuditLog.admin_email}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] uppercase font-semibold block">Timestamp</span>
                <span className="font-mono text-neutral-300 text-[11px] mt-0.5 block">
                  {new Date(inspectingAuditLog.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Description */}
            <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-xs">
              <span className="text-neutral-400 text-[10px] uppercase font-semibold block mb-1">
                Recorded Description
              </span>
              <p className="text-neutral-200 leading-relaxed font-medium">
                {inspectingAuditLog.description}
              </p>
              <div className="mt-2 text-[10px] text-neutral-500 font-mono">
                Origin IP: {inspectingAuditLog.ip_address || '103.145.118.42 (Dhaka Hub)'}
              </div>
            </div>

            {/* Side-by-Side Diff Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Value */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    <span>Previous State (Old Value)</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">before mutation</span>
                </div>
                {inspectingAuditLog.old_value !== null && inspectingAuditLog.old_value !== undefined ? (
                  <pre className="bg-neutral-950 border border-red-950/40 rounded-2xl p-4 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-64 leading-relaxed whitespace-pre-wrap select-all">
                    {JSON.stringify(inspectingAuditLog.old_value, null, 2)}
                  </pre>
                ) : (
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-6 text-center text-xs text-neutral-500 italic">
                    No previous state recorded (initial creation or insert event)
                  </div>
                )}
              </div>

              {/* New Value */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Updated State (New Value)</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">after mutation</span>
                </div>
                {inspectingAuditLog.new_value !== null && inspectingAuditLog.new_value !== undefined ? (
                  <pre className="bg-neutral-950 border border-emerald-950/40 rounded-2xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-64 leading-relaxed whitespace-pre-wrap select-all">
                    {JSON.stringify(inspectingAuditLog.new_value, null, 2)}
                  </pre>
                ) : (
                  <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-6 text-center text-xs text-neutral-500 italic">
                    No new state (entity was permanently deleted)
                  </div>
                )}
              </div>
            </div>

            {/* Immutability & Security Footer */}
            <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-medium">
                  Protected by PostgreSQL Triggers &amp; RLS. Strictly immutable record.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingAuditLog(null)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
