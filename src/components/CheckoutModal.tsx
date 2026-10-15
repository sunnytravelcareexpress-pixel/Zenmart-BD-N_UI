import React, { useState, useEffect } from 'react';
import { CartItem, Order } from '../types';
import { BANGLADESH_DISTRICTS } from '../data/mockData';
import { X, CheckCircle2, ShieldCheck, Copy, AlertCircle } from 'lucide-react';
import { createOrder } from '../lib/databaseService';
import { useAuth } from '../lib/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  discountAmount: number;
  discountCode: string;
  onOrderSuccess: (order: Order) => void;
  onShowOrderTracking?: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  discountAmount,
  discountCode,
  onOrderSuccess,
  onShowOrderTracking,
}) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'card'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Always reset confirmedOrder whenever the modal opens, so every checkout requires entering/confirming details
  useEffect(() => {
    if (isOpen) {
      setConfirmedOrder(null);
      setIsSubmitting(false);
      setErrorMessage('');

      // Pre-fill user defaults if logged in, but keep address and details editable
      if (user) {
        setFullName((prev) => (prev ? prev : user.full_name || ''));
        setPhone((prev) => (prev ? prev : user.phone?.replace('+880', '').trim() || ''));
        setEmail((prev) => (prev ? prev : user.email || ''));
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    setConfirmedOrder(null);
    setIsSubmitting(false);
    setErrorMessage('');
    onClose();
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= 1000;
  const deliveryFee = isFreeDelivery ? 0 : district === 'Dhaka' ? 60 : 120;
  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    const cleanAddress = address.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 11-digit Bangladesh mobile number (e.g. 018XXXXXXXX).');
      return;
    }

    if (!cleanAddress) {
      setErrorMessage('Please provide your detailed delivery address (House, Road, Area).');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add products to your cart before checking out.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = cleanPhone.startsWith('+880')
        ? cleanPhone
        : cleanPhone.startsWith('880')
        ? `+${cleanPhone}`
        : `+880${cleanPhone.replace(/^[0]/, '')}`;

      const order = await createOrder({
        userId: user?.id,
        customerName: cleanName,
        phone: formattedPhone,
        email: email.trim(),
        address: cleanAddress,
        city: district,
        area: area.trim(),
        items,
        subtotal,
        deliveryCharge: deliveryFee,
        discount: discountAmount,
        total: finalTotal,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase(),
        notes: notes.trim(),
      });

      setConfirmedOrder(order);
      onOrderSuccess(order);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(
        err?.message || 'Failed to place order. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D99A24]">local_shipping</span>
            <h3 className="font-display-title text-base sm:text-lg font-bold text-neutral-900">
              {confirmedOrder ? 'Order Confirmed!' : 'Express Checkout (Cash on Delivery)'}
            </h3>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          /* Order Confirmation View */
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#007A3D] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="text-xs font-bold text-[#D99A24] uppercase tracking-wider">
              Dhaka Fulfillment Hub Assigned
            </span>
            <h4 className="font-display-title text-xl sm:text-2xl font-extrabold text-neutral-900 mt-1">
              Thank You, {confirmedOrder.customer.fullName}!
            </h4>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-md">
              Your order has been recorded into the live database. Our logistics concierge will call{' '}
              <strong>{confirmedOrder.customer.phone}</strong> for quick verification before courier pickup.
            </p>

            {/* Order Summary Box */}
            <div className="w-full bg-[#FBF9F8] rounded-2xl p-4 sm:p-5 border border-neutral-200 text-left my-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">Order Number</span>
                  <span className="text-sm font-bold text-neutral-900 font-mono">
                    {confirmedOrder.order_number || confirmedOrder.id}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">Estimated Delivery</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {confirmedOrder.customer.district === 'Dhaka' ? '24 Hours (Express)' : '48-72 Hours (Courier)'}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(confirmedOrder.order_number || confirmedOrder.id)}
                  className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-semibold text-neutral-800">Purchased Items:</span>
                {confirmedOrder.items.map((i) => (
                  <div key={i.product.id} className="flex justify-between text-neutral-600">
                    <span>
                      {i.product.name} × {i.quantity}
                    </span>
                    <span className="tabular-nums font-semibold text-neutral-900">
                      ৳ {(i.product.price * i.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 pt-2 flex justify-between items-center text-sm font-bold text-neutral-900">
                <span>Total Payable on Delivery:</span>
                <span className="text-[#D99A24] text-base tabular-nums">
                  ৳ {confirmedOrder.total.toLocaleString()} BDT
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full">
              <a
                href={`https://wa.me/8801831446111?text=${encodeURIComponent(
                  `Hello ZenMart BD, I placed order ${confirmedOrder.order_number || confirmedOrder.id}. Please verify my delivery to ${confirmedOrder.customer.district}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-[#007A3D] hover:bg-[#006331] text-white py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow transition-colors text-center"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Track on WhatsApp</span>
              </a>

              {onShowOrderTracking && (
                <button
                  onClick={() => {
                    const trackedId = confirmedOrder.order_number || confirmedOrder.id;
                    handleModalClose();
                    onShowOrderTracking(trackedId);
                  }}
                  className="flex-1 bg-[#111111] hover:bg-neutral-800 text-white py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Track in App
                </button>
              )}

              <button
                onClick={handleModalClose}
                className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
            {/* Trust banner */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-[#007A3D] flex-shrink-0" />
              <span>
                <strong>100% Cash on Delivery Guarantee:</strong> Inspect the package before paying the courier rider. Zero upfront fee!
              </span>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Rahman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Mobile Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">
                    +880
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="018XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl pl-14 pr-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="For digital invoice PDF"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Delivery District <span className="text-red-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 'Dhaka' ? '(24h Express Delivery - ৳60)' : '(48-72h Courier - ৳120)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Area / Thana / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhanmondi 27 / Banani Road 11 / Agrabad"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Street Address (House, Road, Apartment) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. House #24, Flat 4B, Road #7, Dhanmondi, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl p-3 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Special Notes / Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call before delivery / Leave at reception"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-[#007A3D] bg-emerald-50/70 text-[#007A3D] shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <span className="text-xs font-bold">Cash on Delivery</span>
                  <span className="text-[10px] text-neutral-500 mt-1">Active &amp; Ready</span>
                </button>
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-left flex flex-col justify-between opacity-60">
                  <span className="text-xs font-bold text-neutral-800">bKash</span>
                  <span className="text-[10px] text-amber-600 font-semibold mt-1">Coming Soon</span>
                </div>
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-left flex flex-col justify-between opacity-60">
                  <span className="text-xs font-bold text-neutral-800">Nagad</span>
                  <span className="text-[10px] text-amber-600 font-semibold mt-1">Coming Soon</span>
                </div>
                <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-left flex flex-col justify-between opacity-60">
                  <span className="text-xs font-bold text-neutral-800">Card / Bank</span>
                  <span className="text-[10px] text-amber-600 font-semibold mt-1">Coming Soon</span>
                </div>
              </div>
            </div>

            {/* Total breakdown */}
            <div className="p-3.5 bg-neutral-100 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 block">Total Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="font-semibold text-neutral-800">
                  Delivery: {deliveryFee === 0 ? 'FREE' : `৳ ${deliveryFee}`}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[11px]">Total to Pay</span>
                <span className="text-lg font-extrabold text-[#D99A24] tabular-nums">
                  ৳ {finalTotal.toLocaleString()} BDT
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#111111] hover:bg-[#D99A24] text-white py-3.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <span>Placing Order in Database...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Confirm Order (৳{finalTotal.toLocaleString()})</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
