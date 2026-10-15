import React from 'react';
import { LOGO_URL } from '../data/mockData';

interface FooterProps {
  onOpenOrderTrack: () => void;
  onSelectCategory: (cat: string) => void;
  onOpenPolicy: (title: string, content: string) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenOrderTrack,
  onSelectCategory,
  onOpenPolicy,
  onOpenAdmin,
}) => {
  return (
    <footer className="w-full bg-[#111111] text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
        {/* Column 1: Brand & Slogan */}
        <div className="flex flex-col gap-4">
          <a className="flex items-center gap-3" href="#">
            <div className="h-10 w-10 rounded-full bg-white border border-neutral-700 flex items-center justify-center p-0.5 overflow-hidden">
              <img
                alt="ZenMart BD"
                className="h-full w-full object-contain"
                src={LOGO_URL}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display-title text-lg font-bold text-white leading-tight">ZenMart BD</span>
              <span className="font-bangla text-xs text-[#D99A24] font-medium mt-0.5">
                স্মার্ট কেনাকাটা, সহজ সমাধান
              </span>
            </div>
          </a>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Your premier online destination for authentic tech gadgets, minimalist workspace accessories, and aesthetic
            home decor in Bangladesh.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <a
              aria-label="Website"
              className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#D99A24] hover:text-[#D99A24] flex items-center justify-center text-neutral-400 transition-colors"
              href="#"
            >
              <span className="material-symbols-outlined text-[16px]">public</span>
            </a>
            <a
              aria-label="Instagram"
              className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#D99A24] hover:text-[#D99A24] flex items-center justify-center text-neutral-400 transition-colors"
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </a>
            <a
              aria-label="YouTube"
              className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#D99A24] hover:text-[#D99A24] flex items-center justify-center text-neutral-400 transition-colors"
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-[16px]">smart_display</span>
            </a>
            <a
              aria-label="TikTok"
              className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#D99A24] hover:text-[#D99A24] flex items-center justify-center text-neutral-400 transition-colors"
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
            >
              <span className="material-symbols-outlined text-[16px]">music_note</span>
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="flex flex-col gap-3">
          <h5 className="font-display-title text-sm font-bold text-white">Quick Links</h5>
          <a
            className="text-xs text-neutral-400 hover:text-white transition-colors"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Home
          </a>
          <a className="text-xs text-neutral-400 hover:text-white transition-colors" href="#best-selling">
            Shop Catalog
          </a>
          <a
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            onClick={() => onSelectCategory('all')}
          >
            All Categories
          </a>
          <a className="text-xs text-neutral-400 hover:text-white transition-colors" href="#why-us">
            About Us
          </a>
          <a className="text-xs text-neutral-400 hover:text-white transition-colors" href="#reviews">
            Customer Reviews
          </a>
          <button
            onClick={() =>
              onOpenPolicy(
                'Frequently Asked Questions',
                'Q: How long does delivery take?\nA: Inside Dhaka 24-48 hours. Outside Dhaka 48-72 hours via Pathao or Steadfast.\n\nQ: Can I check the product before paying?\nA: Yes, all cash-on-delivery orders include package inspection.\n\nQ: Is there any warranty?\nA: All electronic items come with minimum 6 to 12 months official replacement warranty.'
              )
            }
            className="text-left text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Frequently Asked Questions
          </button>
        </div>

        {/* Column 3: Customer Care */}
        <div className="flex flex-col gap-3">
          <h5 className="font-display-title text-sm font-bold text-white">Customer Care</h5>
          <button
            onClick={onOpenOrderTrack}
            className="text-left text-xs text-[#D99A24] font-semibold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
            <span>Track Your Order</span>
          </button>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-left text-xs text-neutral-400 hover:text-[#D99A24] flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              <span>Admin Dashboard</span>
            </button>
          )}
          <button
            onClick={() =>
              onOpenPolicy(
                'Return & Refund Policy',
                'We offer a 7-day hassle-free return or replacement guarantee for any manufacturer defect. If the product arrives damaged or malfunctioning, contact our WhatsApp hotline (+880 1831-446111) with your unboxing video or photos. We arrange immediate courier pickup and free replacement.'
              )
            }
            className="text-left text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Return &amp; Refund Policy
          </button>
          <button
            onClick={() =>
              onOpenPolicy(
                'Shipping & Delivery Terms',
                'Free delivery on orders over ৳1,000 across Bangladesh!\n\nStandard shipping rates:\n• Inside Dhaka: ৳60 BDT\n• Outside Dhaka (all 64 districts): ৳120 BDT\n\nOrders placed before 2:00 PM are processed same-day from our Dhaka Central Fulfillment Hub.'
              )
            }
            className="text-left text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Shipping &amp; Delivery Terms
          </button>
          <button
            onClick={() =>
              onOpenPolicy(
                'Warranty Information',
                'Every gadget sold at ZenMart BD is 100% original and verified. Products include between 6 months to 1 year official replacement warranty. Keep your digital invoice and original packaging box for warranty claims.'
              )
            }
            className="text-left text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Warranty Information
          </button>
          <button
            onClick={() =>
              onOpenPolicy(
                'Privacy Policy',
                'ZenMart BD protects your personal information. Phone numbers and delivery addresses are encrypted and used solely for fulfilling your orders and SMS delivery alerts. We never sell or share customer data.'
              )
            }
            className="text-left text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={() =>
              onOpenPolicy(
                'Terms of Service',
                'By shopping with ZenMart BD, you agree to our fair usage, exchange, and delivery terms governed under consumer protection regulations of Bangladesh.'
              )
            }
            className="text-left text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Terms of Service
          </button>
        </div>

        {/* Column 4: Contact Us */}
        <div className="flex flex-col gap-3">
          <h5 className="font-display-title text-sm font-bold text-white">Contact Us</h5>
          <div className="flex items-start gap-2 text-xs text-neutral-400">
            <span className="material-symbols-outlined text-[16px] text-[#D99A24] mt-0.5">call</span>
            <a href="tel:+8801831446111" className="hover:text-white transition-colors">
              +880 1831-446111
            </a>
          </div>
          <div className="flex items-start gap-2 text-xs text-neutral-400">
            <span className="material-symbols-outlined text-[16px] text-[#D99A24] mt-0.5">mail</span>
            <a href="mailto:support@zenmartbd.com" className="hover:text-white transition-colors">
              support@zenmartbd.com
            </a>
          </div>
          <div className="flex items-start gap-2 text-xs text-neutral-400">
            <span className="material-symbols-outlined text-[16px] text-[#D99A24] mt-0.5">location_on</span>
            <span>Gulshan / Banani, Dhaka, Bangladesh</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-neutral-400">
            <span className="material-symbols-outlined text-[16px] text-[#D99A24] mt-0.5">schedule</span>
            <span>Sat – Thu: 10:00 AM – 9:00 PM</span>
          </div>
        </div>

        {/* Column 5: Payment Methods */}
        <div className="flex flex-col gap-3">
          <h5 className="font-display-title text-sm font-bold text-white">We Accept</h5>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-white rounded text-[10px] font-bold">
              bKash
            </span>
            <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-white rounded text-[10px] font-bold">
              Nagad
            </span>
            <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-white rounded text-[10px] font-bold">
              Visa
            </span>
            <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-white rounded text-[10px] font-bold">
              Mastercard
            </span>
            <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-white rounded text-[10px] font-bold">
              SSLCommerz
            </span>
            <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-[#3dbd60] rounded text-[10px] font-bold">
              Cash on Delivery
            </span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800 mt-2">
            <span className="material-symbols-outlined text-[20px] text-[#3dbd60]">verified_user</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">100% Encrypted Payment</span>
              <span className="text-[10px] text-neutral-400">Authorized Bank &amp; MFS Gateway</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Sub-Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
        <p>© 2026 ZenMart BD. All rights reserved. Designed for smart lifestyle &amp; verified modern living in Bangladesh.</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onOpenPolicy('Privacy Policy', 'ZenMart BD respects your privacy.')}
            className="hover:text-neutral-300 transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenPolicy('Terms & Conditions', 'Terms & conditions apply across Bangladesh.')}
            className="hover:text-neutral-300 transition-colors"
          >
            Terms &amp; Conditions
          </button>
          <span>•</span>
          <a className="hover:text-neutral-300 transition-colors" href="#">
            Sitemap
          </a>
        </div>
      </div>
    </footer>
  );
};
