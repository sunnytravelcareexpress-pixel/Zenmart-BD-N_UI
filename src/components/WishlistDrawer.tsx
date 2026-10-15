import React from 'react';
import { Product } from '../types';
import { X, Trash2, ShoppingBag, Heart } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemove: (product: Product) => void;
  onMoveToCart: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  products,
  onRemove,
  onMoveToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              <h2 className="font-display-title text-base sm:text-lg font-bold text-neutral-900">
                Your Saved Wishlist ({products.length})
              </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100">
            {products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mb-3">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-neutral-800">Your wishlist is empty</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  Tap the heart icon on any gadget or decor item to save it for later.
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#111111] hover:bg-[#D99A24] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              products.map((prod) => (
                <div key={prod.id} className="py-4 first:pt-0 last:pb-0 flex gap-3.5 items-center">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-16 h-16 rounded-xl object-cover bg-neutral-100 border border-neutral-200"
                  />
                  <div className="flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">
                      {prod.name}
                    </h4>
                    <span className="text-xs font-bold text-[#D99A24] tabular-nums">
                      ৳ {prod.price.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onMoveToCart(prod)}
                        className="bg-[#111111] hover:bg-[#D99A24] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => onRemove(prod)}
                        className="text-neutral-400 hover:text-red-500 p-1.5 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
