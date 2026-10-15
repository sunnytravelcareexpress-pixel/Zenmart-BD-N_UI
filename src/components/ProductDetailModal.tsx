import React, { useState } from 'react';
import { Product } from '../types';
import { X, Check, Shield, Truck, RotateCcw, Plus, Minus, Heart } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const whatsappUrl = `https://wa.me/8801831446111?text=${encodeURIComponent(
    `Hello ZenMart BD, I want to order "${product.name}" (Qty: ${quantity}, Price: ৳${product.price * quantity}). Please confirm availability.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-neutral-100 text-neutral-600 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Product Image */}
          <div className="bg-neutral-100 p-6 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-sm">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className="absolute top-3 left-3 bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                  {product.badge.text}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-200 text-[11px] text-neutral-600">
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/80 border border-neutral-200/60">
                <Truck className="w-4 h-4 text-[#D99A24] mb-1" />
                <span className="font-bold text-neutral-800">24-48h</span>
                <span>Fast BD Courier</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/80 border border-neutral-200/60">
                <Shield className="w-4 h-4 text-[#007A3D] mb-1" />
                <span className="font-bold text-neutral-800">1 Year</span>
                <span>BD Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/80 border border-neutral-200/60">
                <RotateCcw className="w-4 h-4 text-[#D99A24] mb-1" />
                <span className="font-bold text-neutral-800">7 Days</span>
                <span>Easy Return</span>
              </div>
            </div>
          </div>

          {/* Right: Details & Buying actions */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[#D99A24] uppercase tracking-wider block">
                  {product.brandTag}
                </span>
                <h3 className="font-display-title text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-[#D99A24]">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="material-symbols-outlined text-[16px] fill-current"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-neutral-900">{product.rating}</span>
                  <span className="text-xs text-neutral-500">
                    ({product.reviewsCount} verified customer ratings)
                  </span>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#111111] tabular-nums">
                  ৳ {product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    ৳ {product.originalPrice.toLocaleString()}
                  </span>
                )}
                {product.discountPercent && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    Save {product.discountPercent}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-emerald-800">In Stock in Dhaka Fulfillment Hub</span>
                <span className="text-neutral-400">({product.stockCount} units available)</span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {product.description}
              </p>

              {/* Features list */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">
                    Key Highlights:
                  </span>
                  {product.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                      <Check className="w-3.5 h-3.5 text-[#007A3D] mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Specs Table */}
              {product.specs && (
                <div className="pt-2">
                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-xs space-y-1">
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5 border-b border-neutral-200/50 last:border-0">
                        <span className="text-neutral-500">{k}</span>
                        <span className="font-semibold text-neutral-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-neutral-300 rounded-xl bg-neutral-50 overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-bold text-neutral-800 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 hover:bg-neutral-200 text-neutral-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  className="flex-1 bg-[#111111] hover:bg-[#D99A24] text-white py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  <span>Add to Cart (৳{(product.price * quantity).toLocaleString()})</span>
                </button>

                {/* Wishlist button */}
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-3 rounded-xl border transition-colors ${
                    isWishlisted
                      ? 'bg-red-50 text-red-500 border-red-300'
                      : 'border-neutral-300 hover:border-neutral-400 text-neutral-500'
                  }`}
                  title="Save to wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Direct WhatsApp button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#007A3D] hover:bg-[#006331] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors text-center"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Direct Order on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
