import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedCheckout: () => void;
  discountCode: string;
  onApplyDiscount: (code: string) => boolean;
  discountAmount: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  discountCode,
  onApplyDiscount,
  discountAmount,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= 1000;
  const deliveryFee = isFreeDelivery || items.length === 0 ? 0 : 60;
  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;
    const success = onApplyDiscount(couponInput.trim().toUpperCase());
    if (!success) {
      setCouponError('Invalid coupon. Try "ZENMART10" for 10% off.');
    } else {
      setCouponInput('');
    }
  };

  const whatsappOrderText = encodeURIComponent(
    `Hello ZenMart BD, I want to place an order for:\n` +
      items.map((i) => `• ${i.product.name} (Qty: ${i.quantity}) - ৳${i.product.price * i.quantity}`).join('\n') +
      `\nSubtotal: ৳${subtotal}\nTotal: ৳${finalTotal}\nPlease confirm my delivery details.`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D99A24]">shopping_bag</span>
              <h2 className="font-display-title text-base sm:text-lg font-bold text-neutral-900">
                Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Alert Bar */}
          <div className="px-5 py-2.5 bg-[#FEF6E9] border-b border-amber-200/60 text-xs">
            {isFreeDelivery ? (
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                <span className="text-base">🎉</span>
                <span>You unlocked <strong>Free Delivery</strong> all over Bangladesh!</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-neutral-700">
                <span>Add <strong>৳{(1000 - subtotal).toLocaleString()}</strong> more for Free Delivery!</span>
                <span className="font-bold text-[#D99A24]">Target: ৳1,000</span>
              </div>
            )}
            <div className="w-full bg-amber-200/50 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#D99A24] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                  <span className="material-symbols-outlined text-3xl">shopping_cart</span>
                </div>
                <h3 className="font-bold text-base text-neutral-800">Your cart is empty</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-4 max-w-xs">
                  Looks like you haven't added any premium gadgets to your cart yet.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#111111] hover:bg-[#D99A24] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-neutral-100 border border-neutral-200 flex-shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-neutral-500">{item.product.brandTag}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50 overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-neutral-200 text-neutral-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-neutral-800 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-neutral-200 text-neutral-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 tabular-nums">
                          ৳ {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-neutral-400 block tabular-nums">
                            ৳ {item.product.price.toLocaleString()} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Order Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50/80 flex flex-col gap-3">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Coupon: ZENMART10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full text-xs uppercase bg-white border border-neutral-300 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#D99A24]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-[#D99A24] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Apply
                </button>
              </form>

              {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
              {discountCode && (
                <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span>Coupon <strong>{discountCode}</strong> applied</span>
                  <span className="font-bold">-৳ {discountAmount.toLocaleString()}</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-neutral-600 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    ৳ {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {deliveryFee === 0 ? (
                      <span className="text-[#007A3D] font-bold">FREE</span>
                    ) : (
                      `৳ ${deliveryFee}`
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold tabular-nums">-৳ {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total Amount</span>
                  <span className="text-[#D99A24] tabular-nums">৳ {finalTotal.toLocaleString()} BDT</span>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={onProceedCheckout}
                className="w-full bg-[#111111] hover:bg-[#D99A24] text-white font-bold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>Proceed to Checkout (Cash-on-Delivery)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/8801831446111?text=${whatsappOrderText}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#007A3D] hover:bg-[#006331] text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Fast Order via WhatsApp Concierge</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
