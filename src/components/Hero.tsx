import React from 'react';
import { SPOTLIGHT_PRODUCT } from '../data/mockData';
import { Product } from '../types';

interface HeroProps {
  onBuySpotlight: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({ onBuySpotlight, onSelectProduct }) => {
  return (
    <section className="relative bg-[#111111] text-white overflow-hidden py-16 sm:py-20 lg:py-24">
      {/* Ambient Lighting & Subtle Grid Glow */}
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-[#D99A24]/12 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#D99A24]/10 blur-[140px] pointer-events-none" />
      <div
        className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Hero Left Copy */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 w-fit">
              <span className="w-2 h-2 rounded-full bg-[#3dbd60] animate-pulse" />
              <span className="text-xs font-semibold text-neutral-200">ZenMart BD</span>
              <span className="text-neutral-500">•</span>
              <span className="font-bangla text-xs text-[#D99A24] font-medium">স্মার্ট কেনাকাটা, সহজ সমাধান</span>
            </div>

            <h1 className="font-display-title text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Modern Tech &amp; <br />
              <span className="text-[#D99A24]">Home Essentials</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 max-w-xl font-normal leading-relaxed">
              Discover curated premium gadgets, sleek workspace electronics, and Scandinavian home decor at Bangladesh’s
              most competitive prices. 100% verified authenticity with nationwide Cash-on-Delivery.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                className="bg-[#D99A24] hover:bg-[#C2871A] text-white font-semibold text-sm px-7 py-3.5 rounded-xl flex items-center gap-2.5 shadow-lg shadow-[#D99A24]/20 hover:-translate-y-0.5 transition-all duration-200"
                href="#best-selling"
              >
                <span>Shop Now</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
              <a
                className="bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-6 py-3.5 rounded-xl border border-white/20 backdrop-blur-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all duration-200"
                href="#categories"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                <span>Explore Categories</span>
              </a>
            </div>

            {/* Trust Indicators Inside Hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10 mt-4">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#D99A24] flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Fast Delivery</span>
                  <span className="text-[11px] text-neutral-400">All over BD</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#3dbd60] flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Secure Payment</span>
                  <span className="text-[11px] text-neutral-400">100% Safe</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#D99A24] flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Quality Items</span>
                  <span className="text-[11px] text-neutral-400">Tested Genuine</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#3dbd60] flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">24/7 Support</span>
                  <span className="text-[11px] text-neutral-400">+880 1831-446111</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right: Curated Daily Spotlight */}
          <div className="lg:col-span-5 relative">
            <div className="relative bg-white/[0.07] backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-2xl overflow-hidden group">
              {/* Spotlight Card Image */}
              <div
                className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden mb-4 bg-neutral-900 cursor-pointer"
                onClick={() => onSelectProduct(SPOTLIGHT_PRODUCT)}
              >
                <div
                  className="bg-cover bg-center w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  style={{ backgroundImage: `url('${SPOTLIGHT_PRODUCT.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Floating Badges */}
                <div className="absolute top-3.5 left-3.5 bg-black/75 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D99A24]" />
                  <span>TODAY'S EXCLUSIVE DROP</span>
                </div>

                <div className="absolute top-3.5 right-3.5 bg-red-600 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold shadow-md">
                  Save ৳750
                </div>

                <div className="absolute bottom-3 left-3 text-xs text-neutral-300 font-medium flex items-center gap-1">
                  <span className="text-[#D99A24]">★</span>
                  <span>4.9 (240+ verified buyer reviews)</span>
                </div>
              </div>

              {/* Product Info Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col cursor-pointer" onClick={() => onSelectProduct(SPOTLIGHT_PRODUCT)}>
                  <h3 className="font-display-title text-base sm:text-lg font-bold text-white group-hover:text-[#D99A24] transition-colors">
                    {SPOTLIGHT_PRODUCT.name}
                  </h3>
                  <span className="text-xs text-neutral-400 mt-0.5">
                    Asymmetric Optical Design • Zero Screen Glare
                  </span>
                  <div className="flex items-baseline gap-2.5 mt-2">
                    <span className="text-xl font-extrabold text-[#D99A24] tabular-nums">
                      ৳ {SPOTLIGHT_PRODUCT.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-neutral-500 line-through tabular-nums">
                      ৳ {SPOTLIGHT_PRODUCT.originalPrice?.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                      In Stock BD
                    </span>
                  </div>
                </div>

                <button
                  className="bg-[#007A3D] hover:bg-[#006331] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 flex-shrink-0 cursor-pointer"
                  onClick={() => onBuySpotlight(SPOTLIGHT_PRODUCT)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Carousel Pagination & Guarantee */}
              <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-1.5 rounded-full bg-[#D99A24]" />
                  <span className="w-2 h-1.5 rounded-full bg-white/20" />
                  <span className="w-2 h-1.5 rounded-full bg-white/20" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="font-bangla">ঢাকা সিটিতে ২৪ ঘণ্টায় ডেলিভারি</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
