import React, { useState } from 'react';

interface NewsletterProps {
  onNotify: (msg: string) => void;
}

export const Newsletter: React.FC<NewsletterProps> = ({ onNotify }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    onNotify('ধন্যবাদ! ZenMart BD নিউজলিস্টে যুক্ত হওয়ার জন্য। You have successfully subscribed with 10% coupon code: ZENMART10');
  };

  return (
    <section className="py-20 lg:py-24 bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#111111] text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl border border-neutral-800">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#D99A24]/15 blur-[100px] pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#D99A24]/10 blur-[90px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D99A24]/20 border border-[#D99A24]/30 text-[#D99A24] flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">mail</span>
            </div>

            <h2 className="font-display-title text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Stay Updated With ZenMart
            </h2>
            <p className="text-sm text-neutral-300 max-w-lg leading-relaxed">
              Get instant alerts for freshly landed gadget drops, secret weekend flash sales, and exclusive VIP coupons.
              No spam ever.
            </p>

            {subscribed ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                <span>Thank you! Use coupon code <strong className="text-white bg-emerald-800 px-2 py-0.5 rounded">ZENMART10</strong> for 10% off your first order.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row items-center gap-2.5 pt-3">
                <input
                  className="w-full bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 px-4 py-3 rounded-xl focus:outline-none focus:border-[#D99A24] focus:ring-2 focus:ring-[#D99A24]/30 text-xs sm:text-sm"
                  placeholder="Enter your email address..."
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className="w-full sm:w-auto flex-shrink-0 bg-[#D99A24] hover:bg-[#C2871A] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-105 cursor-pointer"
                  type="submit"
                >
                  <span>Subscribe</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </form>
            )}

            <div className="flex items-center gap-4 pt-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#3dbd60]">verified</span>
                <span>100% Privacy Protected</span>
              </span>
              <span>•</span>
              <span>Unsubscribe anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
