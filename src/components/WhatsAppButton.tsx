import React, { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  storeName?: string;
}

export default function WhatsAppButton({
  phoneNumber = "9935118811",
  storeName = "Neeraj General Store",
}: WhatsAppButtonProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const formattedPhone = phoneNumber.replace(/[^0-9]/g, "");
  const waPhone = formattedPhone.startsWith("91") && formattedPhone.length === 12 
    ? formattedPhone 
    : `91${formattedPhone}`;

  const defaultMessage = encodeURIComponent(
    `Hello ${storeName}! 👋 I would like to enquire about products / my order.`
  );
  const whatsappUrl = `https://wa.me/${waPhone}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 group">
      {/* Mini quick message popover on hover/click */}
      {isTooltipOpen && (
        <div className="mb-1 bg-[#18181B] text-white p-3 rounded-2xl shadow-2xl border border-white/10 w-64 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-zinc-200">Online Support</span>
            </div>
            <button
              onClick={() => setIsTooltipOpen(false)}
              className="text-zinc-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[12px] text-zinc-300 leading-relaxed mb-3">
            Namaste! Need help with an order or product inquiry? Chat with us directly on WhatsApp.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      )}

      {/* Main Floating Button */}
      <div className="flex items-center gap-2.5">
        {/* Mobile / Desktop Label Pill */}
        <button
          onClick={() => setIsTooltipOpen(!isTooltipOpen)}
          className="hidden sm:flex items-center gap-1.5 bg-[#18181B]/95 hover:bg-[#27272A] text-white text-xs font-medium py-1.5 px-3 rounded-full border border-white/10 shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
          <span>Help / Order on WhatsApp</span>
        </button>

        {/* WhatsApp Icon Circle */}
        <a
          id="whatsapp-floating-btn"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp (9935118811)"
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-90 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(37,211,102,0.4)] hover:shadow-[0_10px_30px_rgba(37,211,102,0.6)] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40 cursor-pointer"
        >
          {/* Subtle pulse wave */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none"></span>

          {/* Official WhatsApp SVG Vector Icon */}
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-white relative z-10 drop-shadow-sm"
            viewBox="0 0 24 24"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>

          {/* Unread badge dot */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#121212]">
            1
          </span>
        </a>
      </div>
    </div>
  );
}
