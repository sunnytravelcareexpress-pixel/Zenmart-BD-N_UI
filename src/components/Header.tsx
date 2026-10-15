import React, { useState, useRef, useEffect } from 'react';
import { LOGO_URL } from '../data/mockData';
import { Product } from '../types';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onSelectCategory: (categoryKey: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  currentUser: { name: string; phone?: string; email?: string } | null;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  allProducts,
  onSelectProduct,
  currentUser,
  onOpenAdmin,
  isAdmin = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter search preview items
  const searchResults = searchQuery.trim()
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR */}
      <aside aria-label="Announcement bar" className="bg-[#111111] text-neutral-300 text-xs border-b border-neutral-800 tracking-normal transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap custom-scrollbar">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="text-sm">🚚</span>
              <span>Free Delivery on orders over <strong className="text-white font-semibold">৳1,000 BDT</strong></span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-neutral-300">
              <span className="text-sm">🔒</span>
              <span>100% Secure Payment</span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-neutral-300">
              <span className="text-sm">↩</span>
              <span>Easy 7-Day Return &amp; Refund</span>
            </span>
            <span className="hidden xl:inline-flex items-center gap-1.5 text-[#D99A24] font-bangla font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D99A24]"></span>
              <span>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি</span>
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 text-xs">
            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer bg-[#D99A24] text-neutral-950 hover:bg-amber-400 shadow-xs"
                title="Open Admin Dashboard"
              >
                <span className="material-symbols-outlined text-[13px]">
                  admin_panel_settings
                </span>
                <span>Admin Dashboard</span>
              </button>
            )}
            <span className="hidden sm:inline text-neutral-600">|</span>
            <span className="hidden sm:inline text-neutral-400">Follow:</span>
            <div className="flex items-center gap-3 text-neutral-300">
              <a aria-label="Facebook" className="hover:text-[#D99A24] transition-colors" href="https://facebook.com" target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined text-[15px]">public</span>
              </a>
              <a aria-label="Instagram" className="hover:text-[#D99A24] transition-colors" href="https://instagram.com" target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined text-[15px]">photo_camera</span>
              </a>
              <a aria-label="YouTube" className="hover:text-[#D99A24] transition-colors" href="https://youtube.com" target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined text-[15px]">smart_display</span>
              </a>
              <a aria-label="TikTok" className="hover:text-[#D99A24] transition-colors" href="https://tiktok.com" target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined text-[15px]">music_note</span>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Mobile Hamburger & Brand Container */}
            <div className="flex items-center gap-3">
              <button
                aria-label="Open mobile navigation"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 -ml-1 text-neutral-800 hover:text-[#D99A24] focus:outline-none transition-colors"
              >
                <span className="material-symbols-outlined text-[26px]">
                  {mobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>

              {/* Brand Identity */}
              <a
                className="flex items-center gap-3 group flex-shrink-0"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategory('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="h-11 w-11 rounded-full overflow-hidden border border-neutral-200 shadow-xs flex items-center justify-center bg-white group-hover:border-[#D99A24] transition-colors p-0.5">
                  <img
                    alt="ZenMart BD Logo"
                    className="h-full w-full object-contain"
                    src={LOGO_URL}
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display-title text-xl sm:text-2xl font-extrabold tracking-tight text-[#111111] group-hover:text-[#D99A24] transition-colors leading-none">
                      ZenMart<span className="text-[#D99A24]">.bd</span>
                    </span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="font-bangla text-[11px] text-[#555555] font-semibold leading-none">
                      স্মার্ট কেনাকাটা, সহজ সমাধান
                    </span>
                  </div>
                </div>
              </a>
            </div>

            {/* Prominent Pill Search Bar (Desktop) */}
            <div className="flex-1 max-w-2xl hidden md:block" ref={searchRef}>
              <form
                className="relative flex items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('best-selling');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="relative w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none material-symbols-outlined text-[20px]">
                    search
                  </span>
                  <input
                    className="w-full bg-[#F5F5F5] hover:bg-neutral-100 text-sm text-[#111111] placeholder:text-neutral-400 rounded-full pl-11 pr-28 py-2.5 border border-transparent focus:border-[#D99A24] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D99A24]/10 transition-all"
                    placeholder="Search premium gadgets, home decor, smart lighting..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-28 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
                <button
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#D99A24] hover:bg-[#C2871A] text-white text-xs font-semibold px-5 py-2 rounded-full flex items-center gap-1 shadow-sm transition-all hover:shadow"
                  type="submit"
                >
                  <span>Search</span>
                </button>
              </form>

              {/* Autocomplete dropdown */}
              {searchFocused && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 bg-neutral-50 border-b border-neutral-100 text-xs font-semibold text-neutral-600 flex justify-between items-center">
                    <span>Search Results ({searchResults.length})</span>
                    <span className="text-[11px] text-neutral-400">Press enter to view all</span>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                      {searchResults.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            onSelectProduct(prod);
                            setSearchFocused(false);
                          }}
                          className="p-3 hover:bg-amber-50/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-11 h-11 rounded-lg object-cover bg-neutral-100 border border-neutral-200"
                            />
                            <div>
                              <p className="text-xs font-bold text-neutral-900 line-clamp-1">{prod.name}</p>
                              <span className="text-[11px] text-neutral-500">{prod.brandTag}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-extrabold text-[#D99A24] tabular-nums">৳ {prod.price.toLocaleString()}</span>
                            {prod.originalPrice && (
                              <span className="text-[10px] text-neutral-400 line-through block tabular-nums">
                                ৳ {prod.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-neutral-500">
                      No gadgets found matching "{searchQuery}". Try "desk lamp", "earbuds", or "speaker".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Hotline BD Direct */}
              <a
                className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:border-[#D99A24]/40 hover:bg-[#FEF6E9]/40 transition-all text-left"
                href="tel:+8801831446111"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FEF6E9] text-[#D99A24] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider">Hotline BD</span>
                  <span className="text-xs font-bold text-[#111111]">+880 1831-446111</span>
                </div>
              </a>

              {/* User Account */}
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-700 hover:text-[#111111] transition-colors"
                title="Account"
                type="button"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-[11px] text-[#666666] font-medium leading-tight">
                    {currentUser ? (isAdmin ? 'Admin' : 'Logged in as') : 'Welcome'}
                  </span>
                  <span className="text-xs font-bold text-[#111111] leading-tight truncate max-w-[120px]">
                    {currentUser ? currentUser.name : 'Sign In / Register'}
                  </span>
                </div>
              </button>

              {/* Admin Portal Quick Action Button (Strictly for verified Admins) */}
              {isAdmin && onOpenAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-[#111111] text-[#D99A24] border-[#111111] hover:bg-[#262626]"
                  title="Open Admin Dashboard"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#D99A24]">
                    admin_panel_settings
                  </span>
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}

              {/* Wishlist Counter */}
              <button
                onClick={onOpenWishlist}
                className="relative p-2 hover:bg-neutral-100 rounded-xl text-neutral-700 hover:text-red-500 transition-colors"
                title="Wishlist"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">favorite</span>
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#111111] text-[#D99A24] text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart Pill & Value */}
              <button
                className="flex items-center gap-2.5 bg-[#111111] hover:bg-neutral-900 text-white pl-3.5 pr-4 py-2 rounded-xl transition-all shadow-sm hover:shadow group cursor-pointer"
                onClick={onOpenCart}
                type="button"
              >
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[20px] text-[#D99A24]">shopping_bag</span>
                  <span className="absolute -top-1.5 -right-2 bg-[#D99A24] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-[#111111]">
                    {cartCount}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold leading-none">
                  <span className="hidden sm:inline text-neutral-300 font-medium">Cart ·</span>
                  <span className="text-[#D99A24] font-extrabold tracking-tight tabular-nums">
                    ৳ {cartTotal.toLocaleString()}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Form */}
          <div className="mt-3 md:hidden">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 material-symbols-outlined text-[18px]">
                search
              </span>
              <input
                className="w-full bg-neutral-100 text-xs text-[#111111] rounded-xl pl-10 pr-20 py-2.5 border border-transparent focus:border-[#D99A24] focus:bg-white focus:outline-none"
                placeholder="Search products in Bangladesh..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#D99A24] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"
                type="button"
                onClick={() => {
                  const target = document.getElementById('best-selling');
                  target?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Category Strip & Primary Navigation */}
        <nav className="border-t border-neutral-100 bg-[#FAFAFA] text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* All Categories Mega Dropdown Trigger */}
              <div className="relative">
                <button
                  className="bg-[#D99A24] hover:bg-[#C2871A] text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  type="button"
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  <span>All Categories</span>
                  <span className="material-symbols-outlined text-[16px]">
                    {categoriesOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {categoriesOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <button
                      onClick={() => {
                        onSelectCategory('all');
                        setCategoriesOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-[#FEF6E9] hover:text-[#D99A24] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#D99A24]">category</span>
                        All Products
                      </span>
                      <span className="text-[10px] text-neutral-400">18 items</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectCategory('smart-gadgets');
                        setCategoriesOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-[#FEF6E9] hover:text-[#D99A24] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#D99A24]">watch</span>
                        Smart Gadgets
                      </span>
                      <span className="text-[10px] text-neutral-400">38+ items</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectCategory('home-decor');
                        setCategoriesOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-[#FEF6E9] hover:text-[#D99A24] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#D99A24]">cottage</span>
                        Home &amp; Decor
                      </span>
                      <span className="text-[10px] text-neutral-400">19+ items</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectCategory('desk-setups');
                        setCategoriesOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-[#FEF6E9] hover:text-[#D99A24] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#D99A24]">desk</span>
                        Desk Setups
                      </span>
                      <span className="text-[10px] text-neutral-400">27+ items</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectCategory('ambient-lights');
                        setCategoriesOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-[#FEF6E9] hover:text-[#D99A24] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#D99A24]">lightbulb</span>
                        Ambient Lights
                      </span>
                      <span className="text-[10px] text-neutral-400">14+ items</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectCategory('audio-sound');
                        setCategoriesOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-[#FEF6E9] hover:text-[#D99A24] flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#D99A24]">headphones</span>
                        Audio &amp; Sound
                      </span>
                      <span className="text-[10px] text-neutral-400">15+ items</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Nav Links */}
              <div className="hidden lg:flex items-center gap-1 font-medium text-neutral-700">
                <a
                  className="px-3 py-1.5 rounded-lg bg-neutral-200/70 text-[#111111] font-bold"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Home
                </a>
                <a
                  className="px-3 py-1.5 rounded-lg hover:text-[#111111] hover:bg-neutral-200/50 transition-colors"
                  href="#best-selling"
                >
                  Shop
                </a>
                <button
                  className="px-3 py-1.5 rounded-lg hover:text-[#111111] hover:bg-neutral-200/50 transition-colors"
                  onClick={() => onSelectCategory('electronics')}
                >
                  Electronics
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg hover:text-[#111111] hover:bg-neutral-200/50 transition-colors"
                  onClick={() => onSelectCategory('smart-gadgets')}
                >
                  Smart Gadgets
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg hover:text-[#111111] hover:bg-neutral-200/50 transition-colors"
                  onClick={() => onSelectCategory('home-decor')}
                >
                  Home &amp; Decor
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg hover:text-[#111111] hover:bg-neutral-200/50 transition-colors"
                  onClick={() => onSelectCategory('mobile-accessories')}
                >
                  Accessories
                </button>
                <a
                  className="px-3 py-1.5 rounded-lg hover:text-[#111111] hover:bg-neutral-200/50 transition-colors"
                  href="#why-us"
                >
                  About Us
                </a>
                <a
                  className="px-3 py-1.5 rounded-lg hover:text-[#111111] hover:bg-neutral-200/50 transition-colors"
                  href="#reviews"
                >
                  Reviews
                </a>
              </div>
            </div>

            {/* WhatsApp Hotline Badge & Quick Chat */}
            <div className="flex items-center gap-3">
              <a
                className="inline-flex items-center gap-1.5 bg-[#007A3D] hover:bg-[#006331] text-white px-3.5 py-1.5 rounded-full font-semibold shadow-sm hover:shadow transition-all"
                href="https://wa.me/8801831446111?text=Hello%20ZenMart%20BD,%20I%20have%20an%20inquiry%20about%20your%20products."
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span className="hidden sm:inline">WhatsApp:</span>
                <span>+880 1831-446111</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Mobile slide menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-neutral-200 px-4 py-4 animate-in fade-in duration-200">
            {/* Mobile Brand & Logo Header */}
            <div className="flex items-center gap-3 pb-3 mb-2 border-b border-neutral-100">
              <div className="h-10 w-10 rounded-full overflow-hidden border border-neutral-200 shadow-xs flex items-center justify-center bg-white p-0.5 shrink-0">
                <img
                  alt="ZenMart BD Logo"
                  className="h-full w-full object-contain"
                  src={LOGO_URL}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-display-title text-base font-extrabold text-[#111111] leading-none">
                  ZenMart<span className="text-[#D99A24]">.bd</span>
                </span>
                <span className="font-bangla text-[11px] text-[#555555] font-semibold mt-1 leading-tight">
                  স্মার্ট কেনাকাটা, সহজ সমাধান
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="#"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-bold text-neutral-900 bg-neutral-100 rounded-lg"
              >
                Home
              </a>
              <a
                href="#best-selling"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Best Selling Products
              </a>
              <button
                onClick={() => {
                  onSelectCategory('smart-gadgets');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Smart Gadgets
              </button>
              <button
                onClick={() => {
                  onSelectCategory('home-decor');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Home &amp; Decor
              </button>
              <button
                onClick={() => {
                  onSelectCategory('desk-setups');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Desk Setups
              </button>
              <a
                href="#why-us"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Why Choose ZenMart
              </a>
              <a
                href="#reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Customer Reviews
              </a>
              {isAdmin && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full text-left py-2.5 px-3 text-sm font-bold text-[#D99A24] bg-neutral-900 rounded-xl flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    <span>Admin Dashboard</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#D99A24] text-neutral-950 font-black">
                    CONTROL
                  </span>
                </button>
              )}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                <span>Direct Hotline:</span>
                <a href="tel:+8801831446111" className="font-bold text-[#111111]">
                  +880 1831-446111
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
