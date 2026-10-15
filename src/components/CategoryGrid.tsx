import React from 'react';
import { CATEGORIES } from '../data/mockData';

interface CategoryGridProps {
  onSelectCategory: (categoryKey: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
  return (
    <section className="py-20 lg:py-24 bg-[#FBF9F8]" id="categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#D99A24]">
              Curated Catalog
            </span>
            <h2 className="font-display-title text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight mt-1">
              Shop by Category
            </h2>
            <p className="text-sm text-[#666666] mt-1">
              Explore our thoughtfully selected essentials for modern digital living in Bangladesh.
            </p>
          </div>
          <button
            onClick={() => {
              onSelectCategory('all');
              const el = document.getElementById('best-selling');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#D99A24] hover:text-[#C2871A] group cursor-pointer"
          >
            <span>View All Categories</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>

        {/* Category Grid (8 Substantial Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.filterKey);
                const el = document.getElementById('best-selling');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-[#D99A24]/40 transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3 cursor-pointer relative"
            >
              {cat.isNew && (
                <div className="absolute top-6 right-6 z-10 bg-[#D99A24] text-white px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider shadow">
                  NEW
                </div>
              )}
              <div className="h-36 sm:h-44 rounded-xl overflow-hidden bg-neutral-100 relative">
                <div
                  className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${cat.image}')` }}
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="font-display-title text-sm font-bold text-[#111111] group-hover:text-[#D99A24] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-[#666666]">{cat.countText}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-[#FEF6E9] group-hover:text-[#D99A24] text-neutral-400 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
