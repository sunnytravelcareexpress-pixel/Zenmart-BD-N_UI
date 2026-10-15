import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  activeCategory: string;
  onResetFilter: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  activeCategory,
  onResetFilter,
}) => {
  return (
    <section className="py-20 lg:py-24 bg-white border-y border-neutral-200" id="best-selling">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h2 className="font-display-title text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                Best Selling Products
              </h2>
            </div>
            <p className="text-sm text-[#666666] mt-1">
              Most loved products by verified customers across Dhaka, Chittagong, Sylhet &amp; nationwide.
            </p>
          </div>
          <button
            onClick={onResetFilter}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#D99A24] hover:text-[#C2871A] group cursor-pointer"
          >
            <span>View All Products</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Fluid 2-col on mobile, 3-col on tablet, 6-col on desktop */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-neutral-50 rounded-3xl border border-neutral-200">
            <span className="material-symbols-outlined text-4xl text-neutral-400 mb-2">search_off</span>
            <h3 className="text-lg font-bold text-neutral-800">No products found</h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-4">
              We couldn't find any products in this selection. Clear your search or browse all categories.
            </p>
            <button
              onClick={onResetFilter}
              className="px-5 py-2.5 bg-[#111111] hover:bg-[#D99A24] text-white text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
