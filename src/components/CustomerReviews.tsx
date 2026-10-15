import React, { useState } from 'react';
import { REVIEWS } from '../data/mockData';

export const CustomerReviews: React.FC = () => {
  const [startIndex, setStartIndex] = useState(0);

  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? REVIEWS.length - 3 : prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => (prev >= REVIEWS.length - 3 ? 0 : prev + 1));
  };

  const visibleReviews = REVIEWS.slice(startIndex, startIndex + 3);
  if (visibleReviews.length < 3) {
    visibleReviews.push(...REVIEWS.slice(0, 3 - visibleReviews.length));
  }

  return (
    <section className="py-20 lg:py-24 bg-[#FBF9F8]" id="reviews">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#D99A24]">
              Social Proof
            </span>
            <h2 className="font-display-title text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight mt-1">
              What Our Customers Say
            </h2>
            <p className="text-sm text-[#666666] mt-1">
              Authentic feedback from verified purchasers across Bangladesh.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Previous review"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <button
              aria-label="Next review"
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-7 border border-neutral-200/80 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-all"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1 text-[#D99A24]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[17px] fill-current"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-sm text-[#222222] leading-relaxed italic">{rev.comment}</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
                <div className="w-10 h-10 rounded-full bg-[#FEF6E9] text-[#D99A24] font-bold text-xs flex items-center justify-center border border-[#D99A24]/30">
                  {rev.avatarInitials}
                </div>
                <div className="flex flex-col">
                  <span className="font-display-title text-xs font-bold text-[#111111]">{rev.author}</span>
                  <span className="text-[11px] text-[#666666] flex items-center gap-1">
                    <span>{rev.location}</span>
                    <span>•</span>
                    <span className="text-[#007A3D] font-medium flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span> Verified Buyer
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel indicator dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span
            className={`h-2 rounded-full transition-all cursor-pointer ${
              startIndex === 0 ? 'w-6 bg-[#D99A24]' : 'w-2 bg-neutral-300'
            }`}
            onClick={() => setStartIndex(0)}
          />
          <span
            className={`h-2 rounded-full transition-all cursor-pointer ${
              startIndex === 1 ? 'w-6 bg-[#D99A24]' : 'w-2 bg-neutral-300'
            }`}
            onClick={() => setStartIndex(1)}
          />
          <span
            className={`h-2 rounded-full transition-all cursor-pointer ${
              startIndex >= 2 ? 'w-6 bg-[#D99A24]' : 'w-2 bg-neutral-300'
            }`}
            onClick={() => setStartIndex(2)}
          />
        </div>
      </div>
    </section>
  );
};
