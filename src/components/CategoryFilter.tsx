import React from 'react';

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalProductsCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  totalProductsCount
}) => {
  const categories = [
    { key: 'all', label: `All Products (${totalProductsCount})` },
    { key: 'smart-gadgets', label: 'Smart Gadgets (6)' },
    { key: 'home-decor', label: 'Home & Decor (4)' },
    { key: 'desk-setups', label: 'Desk Setups (4)' },
    { key: 'ambient-lights', label: 'Ambient Lights (4)' },
  ];

  return (
    <div className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Live BD Dispatch Status & Sort Filter */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[#007A3D] font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007A3D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007A3D]"></span>
            </span>
            <span>
              Dhaka Central Hub: <strong>Ready to Ship</strong>
            </span>
          </span>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-neutral-100 text-xs font-semibold text-neutral-700 py-1.5 pl-3 pr-8 rounded-lg border-0 focus:ring-1 focus:ring-[#D99A24] cursor-pointer appearance-none"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
              expand_more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
