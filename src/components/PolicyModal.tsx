import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D99A24]" />
            <h3 className="font-display-title text-base sm:text-lg font-bold text-neutral-900">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-xs sm:text-sm text-neutral-700 whitespace-pre-line leading-relaxed space-y-3">
            {content}
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-end">
            <button
              onClick={onClose}
              className="bg-[#111111] hover:bg-[#D99A24] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
