import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'bestseller':
        return 'bg-[#111111] text-white';
      case 'popular':
        return 'bg-[#D99A24] text-white';
      case 'essential':
        return 'bg-neutral-800 text-white';
      case 'flash':
        return 'bg-red-600 text-white';
      case 'aesthetic':
        return 'bg-[#111111] text-[#D99A24]';
      case 'smart':
        return 'bg-neutral-900 text-white';
      default:
        return 'bg-[#111111] text-white';
    }
  };

  const whatsappUrl = `https://wa.me/8801831446111?text=${encodeURIComponent(
    `Order ${product.name} (৳${product.price}) from ZenMart BD`
  )}`;

  return (
    <div className="bg-white rounded-2xl p-3 border border-neutral-200 shadow-sm hover:shadow-xl hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between h-full group">
      <div>
        {/* Image Container with Badges */}
        <div
          className="relative w-full aspect-square rounded-xl bg-neutral-50 overflow-hidden mb-3 border border-neutral-100 cursor-pointer"
          onClick={() => onSelectProduct(product)}
        >
          <div
            className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-300"
            style={{ backgroundImage: `url('${product.image}')` }}
          />

          {/* Badge */}
          {product.badge && (
            <span
              className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm ${getBadgeStyle(
                product.badge.type
              )}`}
            >
              {product.badge.text}
            </span>
          )}

          {/* Discount Tag */}
          {product.discountPercent && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              -{product.discountPercent}%
            </span>
          )}

          {/* Wishlist Button */}
          <button
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`absolute bottom-2 right-2 w-7 h-7 rounded-full backdrop-blur flex items-center justify-center transition-all shadow-sm ${
              isWishlisted
                ? 'bg-red-50 text-red-500 ring-1 ring-red-300'
                : 'bg-white/90 hover:bg-white text-neutral-500 hover:text-red-500'
            }`}
            type="button"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                isWishlisted ? 'fill-current' : ''
              }`}
              style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              favorite
            </span>
          </button>
        </div>

        {/* Brand Tag */}
        <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider block">
          {product.brandTag}
        </span>

        {/* Product Title */}
        <h3
          onClick={() => onSelectProduct(product)}
          className="font-display-title text-xs sm:text-sm font-semibold text-[#111111] line-clamp-2 min-h-[2.5rem] group-hover:text-[#D99A24] transition-colors mt-0.5 cursor-pointer"
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 my-1.5">
          <div className="flex text-[#D99A24]">
            <span
              className="material-symbols-outlined text-[14px] fill-current"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
          <span className="text-xs font-bold text-[#111111]">{product.rating}</span>
          <span className="text-[10px] text-[#666666]">({product.reviewsCount})</span>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-sm sm:text-base font-extrabold text-[#111111] tabular-nums">
            ৳ {product.price.toLocaleString()}
          </span>
          {product.originalPrice ? (
            <span className="text-[11px] text-[#666666] line-through tabular-nums">
              ৳ {product.originalPrice.toLocaleString()}
            </span>
          ) : (
            <span className="text-[11px] text-[#666666]">Regular Price</span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-1.5">
        <button
          className="w-full bg-[#111111] hover:bg-[#D99A24] text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          onClick={() => onAddToCart(product)}
          type="button"
        >
          <span className="material-symbols-outlined text-[15px]">shopping_bag</span>
          <span>Add to Cart</span>
        </button>
        <a
          className="w-full bg-[#007A3D] hover:bg-[#006331] text-white text-[11px] font-semibold py-1.5 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm text-center"
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="material-symbols-outlined text-[14px]">chat</span>
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
