import React from 'react';

interface LifestyleBannersProps {
  onSelectCategory: (categoryKey: string) => void;
}

export const LifestyleBanners: React.FC<LifestyleBannersProps> = ({ onSelectCategory }) => {
  return (
    <section className="py-20 lg:py-24 bg-[#FBF9F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Banner 1: Dark Tech Lifestyle */}
        <div className="relative rounded-3xl overflow-hidden bg-[#111111] text-white p-8 sm:p-12 flex flex-col justify-between min-h-[360px] shadow-lg group border border-neutral-800">
          <div className="absolute inset-0 opacity-40 mix-blend-luminosity">
            <div
              className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDljzmbDPQ-VClZjZHUfEw28wi0isK8irZENSkX6ToxaQMXe-StFgCaJOmQZHA2GUY7eNrWCiRG8E0RuCOP_FiCXhYSbfq_h9A8Zv1zsqfJJvKvX3P3462X1sBaGVVn4oyQ8lywOqRBw7euUeP5wrPnOgXJcbO-vsxeRlJKLLClg7S64c_Gffl8Z-9jtgAvElJagLuSj6mqVTSPiBwaveqhYfwvn8D6JsRPZIldo6SrtcpCC907c4AH')`,
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/85 to-transparent" />
          <div className="relative z-10 flex flex-col gap-3 max-w-sm">
            <span className="px-3 py-1 bg-[#D99A24] text-white font-bold text-[11px] uppercase tracking-wider rounded-lg w-fit shadow-sm">
              IN-DEMAND GEAR
            </span>
            <h3 className="font-display-title text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Smart Gadgets, <br />
              Smart Lifestyle
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed font-normal">
              Upgrade your productivity and workspace aesthetics with curated authentic devices delivered straight to your door.
            </p>
          </div>
          <div className="relative z-10 pt-6">
            <button
              onClick={() => {
                onSelectCategory('smart-gadgets');
                const el = document.getElementById('best-selling');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 bg-[#D99A24] hover:bg-[#C2871A] text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md hover:translate-x-1 cursor-pointer"
            >
              <span>Shop Smart Gadgets</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Banner 2: Warm Nordic Living Space */}
        <div className="relative rounded-3xl overflow-hidden bg-white text-[#111111] p-8 sm:p-12 flex flex-col justify-between min-h-[360px] shadow-lg group border border-neutral-200">
          <div className="absolute inset-0 opacity-40">
            <div
              className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuChOPMavPJJyzDZp5mxJPVblJT9z6MkZbatMJH8WQQ0u55adTrtI3ELu7YAF5jo3GAo8gU4fI0ppYF3kbrFd0tru9jaQ3uhM6Fz-achi_Z5u30LO-A8EXnLfVLLEI48e22_5GyWRklH1slhPMslYXZSYozo1EB0r3R9TxOqpg2Ifp147htodKmt-sbxIAQBXzpGGlzGaRHoP-II39UtgrQ0Zjltxi640lfNSmeqSVSIqa4yOlmjjZfX')`,
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent" />
          <div className="relative z-10 flex flex-col gap-3 max-w-sm">
            <span className="px-3 py-1 bg-white text-[#D99A24] border border-[#D99A24]/30 font-bold text-[11px] uppercase tracking-wider rounded-lg w-fit shadow-sm">
              NORDIC &amp; COZY
            </span>
            <h3 className="font-display-title text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight">
              Stylish Home Decor, <br />
              For a Better Space
            </h3>
            <p className="text-sm text-[#666666] leading-relaxed font-normal">
              Minimal, functional and mood-elevating pieces designed to turn your bedroom or living corner into a serene haven.
            </p>
          </div>
          <div className="relative z-10 pt-6">
            <button
              onClick={() => {
                onSelectCategory('home-decor');
                const el = document.getElementById('best-selling');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 bg-[#111111] hover:bg-neutral-800 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md hover:translate-x-1 cursor-pointer"
            >
              <span>Shop Home Decor</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
