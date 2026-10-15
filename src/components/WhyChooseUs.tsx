import React from 'react';

export const WhyChooseUs: React.FC = () => {
  const benefits = [
    {
      title: 'Fast & Reliable Delivery',
      desc: 'Express courier shipping across all 64 districts in Bangladesh with real-time tracking.',
      icon: 'local_shipping',
      iconBg: 'bg-[#FEF6E9]',
      iconColor: 'text-[#D99A24]',
    },
    {
      title: '100% Secure Payment',
      desc: 'Convenient bKash, Nagad, Card, or Cash-on-Delivery after inspecting package.',
      icon: 'verified_user',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-[#007A3D]',
    },
    {
      title: 'Quality & Genuine',
      desc: 'Original verified factory authentic gadgets tested and loved by tech enthusiasts.',
      icon: 'verified',
      iconBg: 'bg-[#FEF6E9]',
      iconColor: 'text-[#D99A24]',
    },
    {
      title: 'Easy Return & Refund',
      desc: 'Hassle-free 7-day replacement guarantee if you encounter any manufacturer defect.',
      icon: 'published_with_changes',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-[#007A3D]',
    },
    {
      title: 'Dedicated Support',
      desc: 'Friendly WhatsApp & phone guidance for setup, troubleshooting, and instant inquiries.',
      icon: 'support_agent',
      iconBg: 'bg-[#FEF6E9]',
      iconColor: 'text-[#D99A24]',
    },
  ];

  return (
    <section className="py-20 lg:py-24 bg-white border-y border-neutral-200" id="why-us">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        <div className="text-center flex flex-col items-center gap-2 max-w-xl mx-auto">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#D99A24]">
            Uncompromising Quality
          </span>
          <h2 className="font-display-title text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
            Why Choose ZenMart?
          </h2>
          <p className="text-sm text-[#666666]">
            Built for trust, convenience, and direct peace of mind for buyers across all 64 districts of Bangladesh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="bg-[#FBF9F8] rounded-2xl p-6 flex flex-col justify-between gap-4 border border-neutral-200/80 hover:-translate-y-1 transition-all duration-300 shadow-sm h-full"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl ${b.iconBg} ${b.iconColor} flex items-center justify-center mb-4`}>
                  <span className="material-symbols-outlined text-[26px]">{b.icon}</span>
                </div>
                <h4 className="font-display-title text-sm font-bold text-[#111111] mb-2">{b.title}</h4>
                <p className="text-xs text-[#666666] leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
