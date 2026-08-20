import { authenticatedFetch } from "../utils/api";
import React, { useState } from "react";
import {
  X,
  Trash2,
  ArrowRight,
  CheckCircle2,
  QrCode,
  CreditCard,
  Building2,
  Banknote,
  ShieldCheck,
  Package,
  Plus
} from "lucide-react";
import { Product, StoreSettings, OrderItem, Order } from "../types";
import PaymentGatewayModal from "./PaymentGatewayModal";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: { product: Product; quantity: number }[];
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  settings: StoreSettings;
  onOrderPlaced: (order: Order) => void;
  onClearCart: () => void;
  customerName?: string | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  settings,
  onOrderPlaced,
  onClearCart,
  customerName: externalCustomerName,
}: CartDrawerProps) {
  // Shipping details form state
  const [customerName, setCustomerName] = useState(externalCustomerName || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | "CARD" | "NETBANKING">("UPI");
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  React.useEffect(() => {
    if (externalCustomerName && !customerName) {
      setCustomerName(externalCustomerName);
    }
  }, [externalCustomerName]);

  // Checking States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderInfo, setPlacedOrderInfo] = useState<any | null>(null);
  const [validationError, setValidationError] = useState("");

  if (!isOpen) return null;

  // Calculators
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0,
  );
  const reachesFreeThreshold = subtotal >= settings.freeDeliveryThreshold;
  const deliveryFee =
    subtotal === 0 ? 0 : reachesFreeThreshold ? 0 : settings.deliveryFee;
  const total = subtotal + deliveryFee;

  // Calculate missing amount for free delivery
  const amountToFree = settings.freeDeliveryThreshold - subtotal;
  const freeProgress = Math.min(
    (subtotal / settings.freeDeliveryThreshold) * 100,
    100,
  );

  const validateForm = () => {
    setValidationError("");

    if (cartItems.length === 0) {
      setValidationError("Your cart is empty. Please add items to proceed.");
      return false;
    }

    if (!customerName.trim()) {
      setValidationError("Please enter your name for delivery.");
      return false;
    }

    if (!customerPhone.trim() || !/^\d{10}$/.test(customerPhone.trim())) {
      setValidationError("Please input a valid 10-digit mobile number.");
      return false;
    }

    if (!customerAddress.trim()) {
      setValidationError("Please specify your delivery address in Kannauj.");
      return false;
    }

    return true;
  };

  const handleOpenGatewayOrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsGatewayOpen(true);
  };

  const handlePaymentGatewaySuccess = async (paymentDetails: {
    paymentMethod: "UPI" | "CARD" | "NETBANKING" | "COD";
    transactionId: string;
    paymentStatus: "PAID" | "PENDING_COD";
    paidAmount: number;
  }) => {
    setIsSubmitting(true);

    const itemsPayload: OrderItem[] = cartItems.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      unit: item.product.unit,
      quantity: item.quantity,
    }));

    const orderPayload = {
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod: paymentDetails.paymentMethod,
      paymentStatus: paymentDetails.paymentStatus,
      transactionId: paymentDetails.transactionId,
      items: itemsPayload,
      subtotal,
      deliveryFee,
      total,
    };

    try {
      const response = await authenticatedFetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to place order.");
      }

      const orderResult = await response.json();
      setPlacedOrderInfo(orderResult);
      onOrderPlaced(orderResult);
      setIsGatewayOpen(false);
    } catch (err: any) {
      setValidationError(
        err.message || "Order placement interrupted. Please try again.",
      );
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setPlacedOrderInfo(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setPaymentMethod("UPI");
    onClearCart();
    onClose();
  };

  // Drag & drop handling on the drawer
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw && onAddToCart) {
        const product = JSON.parse(raw) as Product;
        onAddToCart(product);
      }
    } catch (err) {
      console.error("Drop parse error", err);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end"
        id="cart-drawer-backdrop"
      >
        {/* Semi-transparent Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => {
            if (!placedOrderInfo) onClose();
          }}
        />

        {/* Slide-over Content Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full max-w-md bg-[#0F0F12] h-full shadow-[0_0_50px_rgba(0,0,0,0.8)] border-l flex flex-col z-10 overflow-hidden transition-colors ${
            isDragOver
              ? "border-[#FF6B00] bg-[#1a1410]"
              : "border-border-subtle"
          }`}
        >
          {/* Header bar */}
          <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between bg-[#151518] text-white">
            <div className="flex items-center gap-3">
              <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-zinc-300">
                {placedOrderInfo ? "ORDER RECEIPT" : "Shopping Cart"}
              </h2>
              {!placedOrderInfo && (
                <span className="bg-primary/20 text-primary border border-primary/30 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold tracking-widest">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                if (placedOrderInfo) handleDone();
                else onClose();
              }}
              className="p-1.5 hover:bg-white/10 rounded-full text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drag Overlay Hint when dragging product over cart */}
          {isDragOver && (
            <div className="absolute inset-x-0 top-16 bottom-0 z-30 bg-primary/10 backdrop-blur-xs border-2 border-dashed border-primary m-4 rounded-2xl flex flex-col items-center justify-center text-center p-6 pointer-events-none animate-pulse">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-3">
                <Plus className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Drop to add to cart!</h4>
              <p className="text-xs text-zinc-300 mt-1">Item will be automatically added</p>
            </div>
          )}

          {/* Content Section */}
          {placedOrderInfo ? (
            /* Receipt confirmation screen */
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Order Placed Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                Order ID:{" "}
                <span className="font-mono text-white font-bold bg-white/10 px-2 py-0.5 rounded">
                  {placedOrderInfo.id.substring(0, 8).toUpperCase()}
                </span>
              </p>

              {placedOrderInfo.transactionId && (
                <p className="text-[11px] font-mono text-emerald-400 mt-1">
                  Payment Ref: {placedOrderInfo.transactionId}
                </p>
              )}

              <div className="w-full bg-[#151518] border border-border-subtle rounded-2xl p-4 sm:p-5 mt-6 text-left shadow-lg">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-border-subtle pb-2 mb-3">
                  Order Summary
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {placedOrderInfo.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="text-white font-medium truncate">
                        {item.name}{" "}
                        <span className="text-zinc-400 font-normal">
                          x{item.quantity}
                        </span>
                      </span>
                      <span className="text-white font-mono font-bold">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-border-subtle mt-4 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-zinc-200">
                      ₹{placedOrderInfo.subtotal}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery:</span>
                    <span className="font-mono text-zinc-200">
                      {placedOrderInfo.deliveryFee === 0
                        ? "FREE"
                        : `₹${placedOrderInfo.deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Payment Mode:</span>
                    <span className="font-mono text-primary font-bold">
                      {placedOrderInfo.paymentMethod} ({placedOrderInfo.paymentStatus || "CONFIRMED"})
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/5">
                    <span>Total Amount:</span>
                    <span className="font-mono text-primary text-base">
                      ₹{placedOrderInfo.total}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDone}
                className="w-full bg-primary hover:bg-[#ff7a1a] text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 mt-6 text-xs uppercase tracking-wider"
              >
                Continue Shopping
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-white/5 flex items-center justify-center text-zinc-500 mb-4 shadow-sm">
                <Package className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="font-bold text-white text-base tracking-tight">
                Your cart is empty
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Add products or drag any product card directly into this cart.
              </p>
            </div>
          ) : (
            /* Non-empty Cart View */
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-4">
              {/* Delivery threshold bar */}
              <div className="bg-[#151518] p-3 rounded-xl border border-border-subtle">
                <div className="flex justify-between text-[11px] font-medium mb-1.5">
                  <span className="text-zinc-300">
                    {reachesFreeThreshold
                      ? "🎉 Free Delivery Unlocked!"
                      : `Add ₹${amountToFree} more for FREE Delivery`}
                  </span>
                  <span className="font-mono text-zinc-400">
                    ₹{subtotal} / ₹{settings.freeDeliveryThreshold}
                  </span>
                </div>
                <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                  <div
                    className={`${reachesFreeThreshold ? "bg-emerald-500" : "bg-primary"} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${freeProgress}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest block">
                  Items in Cart ({cartItems.length})
                </span>
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 bg-[#151518] p-2.5 sm:p-3 rounded-xl border border-border-subtle items-center"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-lg bg-black border border-white/5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 font-mono">
                        <span>{item.product.unit}</span>
                        <span>•</span>
                        <span className="text-white font-bold">
                          ₹{item.product.price}
                        </span>
                      </div>
                    </div>

                    {/* Stepper counters */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-black/40 border border-white/10 px-1.5 py-0.5 rounded-lg">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity - 1)
                        }
                        className="text-zinc-400 hover:text-white p-1 rounded cursor-pointer transition-colors"
                        title="Reduce"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.product.stock}
                        className="text-zinc-400 hover:text-white disabled:opacity-20 p-1 rounded cursor-pointer transition-colors"
                        title="Increase"
                      >
                        +
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Delivery Details Form */}
              <form
                onSubmit={handleOpenGatewayOrSubmit}
                className="space-y-4 pt-4 border-t border-border-subtle"
              >
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest block">
                  Delivery Details
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-[#151518] border border-white/10 text-xs sm:text-sm text-white rounded-xl p-2.5 focus:outline-none focus:border-primary transition-colors placeholder-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Mobile Number (10 Digits) *
                    </label>
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="e.g. 9935118811"
                      className="w-full bg-[#151518] border border-white/10 text-xs sm:text-sm text-white rounded-xl p-2.5 font-mono focus:outline-none focus:border-primary transition-colors placeholder-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Delivery Address / Village / Landmark *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="House No., Street, Jalalpur Panwara, Kannauj"
                      className="w-full bg-[#151518] border border-white/10 text-xs sm:text-sm text-white rounded-xl p-2.5 focus:outline-none focus:border-primary transition-colors resize-none placeholder-zinc-600"
                    />
                  </div>
                </div>

                {/* Preferred Payment Mode */}
                <div className="pt-2">
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Payment Gateway Methods
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-left ${
                        paymentMethod === "UPI"
                          ? "border-primary bg-primary/10 text-white font-bold"
                          : "border-white/10 bg-[#151518] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-primary shrink-0" />
                      <div className="truncate">
                        <span className="block text-xs">UPI / QR</span>
                        <span className="block text-[9px] text-zinc-400 font-normal">GPay, PhonePe</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CARD")}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-left ${
                        paymentMethod === "CARD"
                          ? "border-primary bg-primary/10 text-white font-bold"
                          : "border-white/10 bg-[#151518] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-primary shrink-0" />
                      <div className="truncate">
                        <span className="block text-xs">Cards</span>
                        <span className="block text-[9px] text-zinc-400 font-normal">Debit / Credit</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("NETBANKING")}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-left ${
                        paymentMethod === "NETBANKING"
                          ? "border-primary bg-primary/10 text-white font-bold"
                          : "border-white/10 bg-[#151518] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <div className="truncate">
                        <span className="block text-xs">NetBanking</span>
                        <span className="block text-[9px] text-zinc-400 font-normal">All Indian Banks</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all text-left ${
                        paymentMethod === "COD"
                          ? "border-primary bg-primary/10 text-white font-bold"
                          : "border-white/10 bg-[#151518] text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-primary shrink-0" />
                      <div className="truncate">
                        <span className="block text-xs">Cash on Delivery</span>
                        <span className="block text-[9px] text-zinc-400 font-normal">Pay at door</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Validation message */}
                {validationError && (
                  <p className="p-3 border border-red-500/20 bg-red-500/10 text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <span className="font-mono bg-red-400/20 px-1 py-0.5 rounded text-[10px]">
                      ERROR
                    </span>
                    <span>{validationError}</span>
                  </p>
                )}

                {/* Summary calculation */}
                <div className="bg-[#151518] rounded-xl p-3.5 border border-white/5 text-xs space-y-1.5 mt-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-zinc-200">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery Fee:</span>
                    <span className="font-mono text-zinc-200">
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold text-white text-sm">
                    <span>Total Amount:</span>
                    <span className="font-mono text-primary text-base">
                      ₹{total}
                    </span>
                  </div>
                </div>

                {/* Submit action -> Launches Payment Gateway */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-[#ff7a1a] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] uppercase tracking-wider text-xs group"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proceed to Payment Gateway (₹{total})</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modern Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        orderTotal={total}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        settings={settings}
        onPaymentSuccess={handlePaymentGatewaySuccess}
      />
    </>
  );
}
