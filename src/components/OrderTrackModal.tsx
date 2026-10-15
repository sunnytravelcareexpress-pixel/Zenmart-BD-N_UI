import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Truck,
  Package,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Order } from '../types';
import { supabase } from '../lib/supabase';

interface OrderTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentOrders: Order[];
  initialOrderNumber?: string;
}

export const OrderTrackModal: React.FC<OrderTrackModalProps> = ({
  isOpen,
  onClose,
  recentOrders,
  initialOrderNumber = '',
}) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const mapSupabaseOrderToOrder = (o: any): Order => {
    return {
      id: o.id,
      order_number: o.order_number,
      user_id: o.user_id,
      items: (o.items || []).map((it: any) => ({
        product: {
          id: it.product_id || it.id,
          name: it.product_name,
          brandTag: 'ZenMart',
          price: Number(it.unit_price || 0),
          rating: 5,
          reviewsCount: 1,
          image: it.product_image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
          inStock: true,
          stockCount: 10,
          description: '',
          features: [],
        },
        quantity: it.quantity,
      })),
      customer: {
        fullName: o.customer_name,
        phone: o.phone,
        email: o.email,
        district: o.city,
        address: o.shipping_address,
        notes: o.notes,
      },
      paymentMethod: o.payment_method || 'cod',
      payment_status: o.payment_status,
      subtotal: Number(o.subtotal || 0),
      deliveryFee: Number(o.delivery_charge || 0),
      discount: Number(o.discount || 0),
      total: Number(o.total_amount || 0),
      status: o.order_status,
      createdAt: new Date(o.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      trackingNumber: `TRACK-${(o.order_number || '000000').slice(-6)}`,
    };
  };

  const executeSearch = useCallback(async (targetOrderNo: string, targetPhone: string) => {
    const cleanOrderNumber = targetOrderNo.trim();
    const cleanPhone = targetPhone.trim();

    setSearched(false);
    setMatchedOrder(null);
    setErrorMessage('');

    // At least ONE must be entered (both are optional individually)
    if (!cleanOrderNumber && !cleanPhone) {
      setErrorMessage('Please enter either your Order Number or Phone Number.');
      setSearched(true);
      return;
    }

    setLoading(true);

    try {
      let orderFound: Order | null = null;

      // 1. First attempt: call Supabase RPC track_guest_order
      try {
        const { data, error } = await supabase.rpc('track_guest_order', {
          p_order_number: cleanOrderNumber || null,
          p_phone: cleanPhone || null,
        });

        if (!error && data && data.length > 0) {
          orderFound = mapSupabaseOrderToOrder(data[0]);
        }
      } catch (rpcErr) {
        console.warn('RPC track_guest_order attempt failed:', rpcErr);
      }

      // 2. Second attempt: Direct query fallback on orders table
      if (!orderFound) {
        try {
          let q = supabase.from('orders').select('*, items:order_items(*)');
          if (cleanOrderNumber && cleanPhone) {
            const rawPhone = cleanPhone.replace(/[\s-]/g, '').slice(-10);
            q = q
              .or(`order_number.ilike.%${cleanOrderNumber}%,id.eq.${cleanOrderNumber}`)
              .ilike('phone', `%${rawPhone}%`);
          } else if (cleanOrderNumber) {
            q = q.or(`order_number.ilike.%${cleanOrderNumber}%,id.eq.${cleanOrderNumber}`);
          } else if (cleanPhone) {
            const rawPhone = cleanPhone.replace(/[\s-]/g, '').slice(-10);
            q = q.ilike('phone', `%${rawPhone}%`);
          }

          const { data: dbData, error: dbErr } = await q
            .order('created_at', { ascending: false })
            .limit(1);

          if (!dbErr && dbData && dbData.length > 0) {
            orderFound = mapSupabaseOrderToOrder(dbData[0]);
          }
        } catch (dbQueryErr) {
          console.warn('Direct order query fallback error:', dbQueryErr);
        }
      }

      // 3. Third attempt: In-memory & local storage session orders
      if (!orderFound && recentOrders && recentOrders.length > 0) {
        const localMatch = recentOrders.find((o) => {
          const numMatch = cleanOrderNumber
            ? (o.order_number || '').toLowerCase().includes(cleanOrderNumber.toLowerCase()) ||
              o.id.toLowerCase().includes(cleanOrderNumber.toLowerCase())
            : true;
          const phoneMatch = cleanPhone
            ? o.customer?.phone?.replace(/[\s-]/g, '').endsWith(cleanPhone.replace(/[\s-]/g, '').slice(-10))
            : true;

          if (cleanOrderNumber && cleanPhone) {
            return numMatch && phoneMatch;
          }
          if (cleanOrderNumber) return numMatch;
          if (cleanPhone) return phoneMatch;
          return false;
        });

        if (localMatch) {
          orderFound = localMatch;
        }
      }

      if (orderFound) {
        setMatchedOrder(orderFound);
      } else {
        setErrorMessage(
          'No order found matching your search. Please verify your Order Number or Phone Number.'
        );
      }

      setSearched(true);
    } catch (err) {
      console.error('Order tracking failed:', err);
      setErrorMessage(
        'Unable to track this order right now. Please check the Order Number or Phone Number.'
      );
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [recentOrders]);

  useEffect(() => {
    if (isOpen) {
      if (initialOrderNumber) {
        setOrderNumber(initialOrderNumber);
        executeSearch(initialOrderNumber, '');
      } else {
        setSearched(false);
        setMatchedOrder(null);
        setErrorMessage('');
      }
    }
  }, [isOpen, initialOrderNumber, executeSearch]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(orderNumber, phone);
  };

  const status = matchedOrder?.status || 'Pending';

  const statusRank: Record<string, number> = {
    Pending: 1,
    Confirmed: 2,
    Processing: 3,
    Shipped: 4,
    Delivered: 5,
    Cancelled: 0,
  };

  const currentRank = statusRank[status] || 1;

  const isStepComplete = (step: number) =>
    status !== 'Cancelled' && currentRank >= step;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D99A24]">
              local_shipping
            </span>
            <h3 className="font-display-title text-base sm:text-lg font-bold text-neutral-900">
              Live Order Tracking
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Order Number
                </label>
                <span className="text-[11px] text-neutral-400 font-medium">Optional if Phone entered</span>
              </div>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ZMB-20260929-1234"
                className="w-full text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#D99A24]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Phone Number
                </label>
                <span className="text-[11px] text-neutral-400 font-medium">Optional if Order Number entered</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 018XXXXXXXX"
                className="w-full text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#D99A24]"
              />
            </div>

            <p className="text-[11px] text-neutral-500">
              💡 You can search with <strong>either</strong> your Order ID or your Phone Number.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111111] hover:bg-[#D99A24] text-white text-xs sm:text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Tracking Order...' : 'Track Order'}</span>
            </button>
          </form>

          {searched && (
            <div className="mt-5 border-t border-neutral-100 pt-5">
              {matchedOrder ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex justify-between gap-4 text-xs">
                    <div>
                      <span className="text-neutral-500 text-[11px] block">
                        Order Number
                      </span>
                      <span className="font-mono font-bold text-neutral-900 text-sm">
                        {matchedOrder.order_number || matchedOrder.id}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-neutral-500 text-[11px] block">
                        Recipient
                      </span>
                      <span className="font-bold text-neutral-900">
                        {matchedOrder.customer.fullName}
                      </span>
                    </div>
                  </div>

                  {/* Progress Status Steps */}
                  <div className="space-y-3.5 pt-1">
                    <div
                      className={`flex gap-3 items-start ${
                        isStepComplete(1) ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isStepComplete(1)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Order Placed &amp; Logged</p>
                        <p className="text-[11px] text-neutral-500">
                          {matchedOrder.createdAt} • Cash on Delivery
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex gap-3 items-start ${
                        isStepComplete(2) ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isStepComplete(2)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Confirmed by ZenMart Concierge</p>
                        <p className="text-[11px] text-neutral-500">
                          {['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(status)
                            ? `Order confirmed for delivery to ${matchedOrder.customer.district}`
                            : 'Awaiting phone confirmation from fulfillment team'}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex gap-3 items-start ${
                        isStepComplete(3) ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isStepComplete(3)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Dhaka Central Hub / Courier Dispatch</p>
                        <p className="text-[11px] text-neutral-500">
                          Current status: <strong>{status}</strong>
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex gap-3 items-start ${
                        isStepComplete(5) ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isStepComplete(5)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm">Delivered</p>
                        <p className="text-[11px] text-neutral-500">
                          {status === 'Delivered'
                            ? 'Order successfully delivered & verified'
                            : 'Handover to recipient pending'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-3 flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-700">
                      Total Payable on Delivery:
                    </span>
                    <span className="font-bold text-[#D99A24] text-sm tabular-nums">
                      ৳ {matchedOrder.total.toLocaleString()} BDT
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl text-xs text-neutral-600 space-y-1">
                    <p>
                      <strong>Phone:</strong> {matchedOrder.customer.phone}
                    </p>
                    <p>
                      <strong>Delivery Address:</strong> {matchedOrder.customer.address}, {matchedOrder.customer.district}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-10 h-10 mx-auto text-neutral-300 mb-2.5" />
                  <p className="font-bold text-sm text-neutral-800">
                    Order Not Found
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                    {errorMessage || 'Please check your Order Number or Phone Number.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
