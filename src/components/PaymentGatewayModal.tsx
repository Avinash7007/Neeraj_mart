import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  QrCode,
  CreditCard,
  Building2,
  Banknote,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Lock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { StoreSettings } from "../types";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  settings: StoreSettings;
  onPaymentSuccess: (paymentDetails: {
    paymentMethod: "UPI" | "CARD" | "NETBANKING" | "COD";
    transactionId: string;
    paymentStatus: "PAID" | "PENDING_COD";
    paidAmount: number;
  }) => Promise<void>;
}

type PaymentTab = "upi" | "card" | "netbanking" | "cod";

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  orderTotal,
  customerName,
  customerPhone,
  settings,
  onPaymentSuccess,
}: PaymentGatewayModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [step, setStep] = useState<"checkout" | "otp" | "verifying" | "success">("checkout");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(customerName || "");
  const [otpCode, setOtpCode] = useState("");

  // Netbanking bank
  const [selectedBank, setSelectedBank] = useState("HDFC");

  // Error message
  const [errorMsg, setErrorMsg] = useState("");

  // Countdown timer for QR
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (!isOpen) {
      setStep("checkout");
      setIsProcessing(false);
      setErrorMsg("");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const upiId = settings.upiId || "9935118811@upi";
  const upiPayloadUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    settings.storeName
  )}&am=${orderTotal}&cu=INR&tn=Order_NeerajStore_${Date.now().toString().slice(-6)}`;

  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPayloadUrl
  )}`;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const detectCardType = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
    if (/^6(011|5|4[4-9]|22)/.test(clean) || /^60/.test(clean) || /^65/.test(clean) || /^81|82/.test(clean)) return "RuPay";
    return "Card";
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  // Submit payment handler
  const handleProcessPayment = async () => {
    setErrorMsg("");
    setIsProcessing(true);

    try {
      if (activeTab === "upi") {
        const txnId = utrNumber.trim() ? `UPI-${utrNumber.trim()}` : `UPI-${Date.now()}`;
        await onPaymentSuccess({
          paymentMethod: "UPI",
          transactionId: txnId,
          paymentStatus: "PAID",
          paidAmount: orderTotal,
        });
      } else if (activeTab === "card") {
        if (cardNumber.replace(/\s/g, "").length < 16) {
          setErrorMsg("Please enter a valid 16-digit card number.");
          setIsProcessing(false);
          return;
        }
        if (cardExpiry.length < 5) {
          setErrorMsg("Please enter valid card expiry MM/YY.");
          setIsProcessing(false);
          return;
        }
        if (cardCvv.length < 3) {
          setErrorMsg("Please enter 3-digit CVV.");
          setIsProcessing(false);
          return;
        }

        // Simulate 3D-Secure OTP prompt
        setStep("otp");
        setIsProcessing(false);
        return;
      } else if (activeTab === "netbanking") {
        setStep("verifying");
        await new Promise((r) => setTimeout(r, 1800));
        const txnId = `NB-${selectedBank}-${Date.now().toString().slice(-8)}`;
        await onPaymentSuccess({
          paymentMethod: "NETBANKING",
          transactionId: txnId,
          paymentStatus: "PAID",
          paidAmount: orderTotal,
        });
      } else if (activeTab === "cod") {
        const txnId = `COD-${Date.now().toString().slice(-8)}`;
        await onPaymentSuccess({
          paymentMethod: "COD",
          transactionId: txnId,
          paymentStatus: "PENDING_COD",
          paidAmount: orderTotal,
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Payment processing failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg("Please enter the 4-6 digit OTP sent to your registered mobile.");
      return;
    }
    setIsProcessing(true);
    setStep("verifying");
    await new Promise((r) => setTimeout(r, 1500));

    try {
      const txnId = `TXN-CARD-${Date.now().toString().slice(-8)}`;
      await onPaymentSuccess({
        paymentMethod: "CARD",
        transactionId: txnId,
        paymentStatus: "PAID",
        paidAmount: orderTotal,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Card authentication failed.");
      setStep("checkout");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Gateway Header */}
        <div className="bg-[#18181B] border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Neeraj Store Secure Pay
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> 256-Bit SSL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Order for <span className="text-zinc-200 font-medium">{customerName || "Customer"}</span> ({customerPhone || "Express"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block">Amount Due</span>
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight text-primary">
                ₹{orderTotal}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* OTP Screen */}
        {step === "otp" ? (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Smartphone className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">Bank 3D Secure OTP</h4>
            <p className="text-xs text-zinc-400 max-w-sm">
              An OTP has been dispatched to your mobile number linked with {detectCardType(cardNumber)} ending in ****{cardNumber.slice(-4)}.
            </p>

            <div className="w-full max-w-xs space-y-3 pt-2">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 4 or 6-digit OTP (e.g. 123456)"
                className="w-full text-center text-xl tracking-widest font-mono bg-surface border border-white/20 rounded-xl py-3 text-white focus:outline-none focus:border-primary"
                autoFocus
              />
              <button
                onClick={handleVerifyOtp}
                disabled={isProcessing || otpCode.length < 4}
                className="w-full bg-primary hover:bg-[#ff7a1a] disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-wider"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Authorize ₹{orderTotal}
                  </>
                )}
              </button>
              <button
                onClick={() => setStep("checkout")}
                className="text-xs text-zinc-400 hover:text-white underline pt-1"
              >
                Change Payment Method
              </button>
            </div>
          </div>
        ) : step === "verifying" ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h4 className="text-base font-bold text-white">Connecting with Banking Gateway...</h4>
            <p className="text-xs text-zinc-400 max-w-xs">
              Please do not refresh or close this window while we secure your transaction.
            </p>
          </div>
        ) : (
          /* Main Gateway Selector & Forms */
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Left Tabs Menu */}
            <div className="w-full md:w-56 bg-[#151518] border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col overflow-x-auto p-2 gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab("upi")}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-xs font-semibold transition-all whitespace-nowrap md:whitespace-normal cursor-pointer ${
                  activeTab === "upi"
                    ? "bg-primary text-white shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span>UPI / QR Scan</span>
                  <span className={`text-[10px] font-normal ${activeTab === "upi" ? "text-white/80" : "text-zinc-500"}`}>
                    GPay, PhonePe, Paytm
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("card")}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-xs font-semibold transition-all whitespace-nowrap md:whitespace-normal cursor-pointer ${
                  activeTab === "card"
                    ? "bg-primary text-white shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span>Cards</span>
                  <span className={`text-[10px] font-normal ${activeTab === "card" ? "text-white/80" : "text-zinc-500"}`}>
                    Credit & Debit Cards
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("netbanking")}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-xs font-semibold transition-all whitespace-nowrap md:whitespace-normal cursor-pointer ${
                  activeTab === "netbanking"
                    ? "bg-primary text-white shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span>Net Banking</span>
                  <span className={`text-[10px] font-normal ${activeTab === "netbanking" ? "text-white/80" : "text-zinc-500"}`}>
                    SBI, HDFC, ICICI, etc.
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("cod")}
                className={`flex items-center gap-3 p-3 rounded-xl text-left text-xs font-semibold transition-all whitespace-nowrap md:whitespace-normal cursor-pointer ${
                  activeTab === "cod"
                    ? "bg-primary text-white shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Banknote className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span>Cash on Delivery</span>
                  <span className={`text-[10px] font-normal ${activeTab === "cod" ? "text-white/80" : "text-zinc-500"}`}>
                    Pay at your doorstep
                  </span>
                </div>
              </button>
            </div>

            {/* Right Tab Content */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* TAB 1: UPI & DYNAMIC QR */}
              {activeTab === "upi" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Scan QR with any UPI App
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Expires in: {formatTime(timeLeft)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* QR Box */}
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner border border-white/20">
                      <img
                        src={qrImageSrc}
                        alt="UPI Payment QR Code"
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                      <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-zinc-800">
                        <span>BHIM UPI</span> • <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span>
                      </div>
                    </div>

                    {/* Quick Pay Links & UTR Entry */}
                    <div className="space-y-3">
                      <div className="bg-surface p-3 rounded-xl border border-white/5 space-y-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase font-mono">Store UPI ID</span>
                        <div className="flex items-center justify-between gap-2 bg-canvas p-2 rounded-lg border border-white/10">
                          <span className="text-xs font-mono text-white select-all truncate">{upiId}</span>
                          <button
                            onClick={handleCopyUpi}
                            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-white px-2 py-1 bg-primary/10 rounded transition-colors shrink-0"
                          >
                            {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedUpi ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Mobile Instant UPI App Trigger */}
                      <a
                        href={upiPayloadUrl}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Pay directly via UPI App</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>

                      {/* Optional UTR Number Input */}
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                          UPI Ref / UTR No. (Optional)
                        </label>
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="e.g. 324156789012"
                          className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CREDIT / DEBIT CARDS */}
              {activeTab === "card" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Credit or Debit Card
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {detectCardType(cardNumber)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">
                        Card Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4532 •••• •••• 8899"
                          className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                        />
                        <div className="absolute right-3 top-2.5 text-xs font-bold text-primary font-mono">
                          {detectCardType(cardNumber)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">
                          Valid Thru (MM/YY)
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="12/28"
                          className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">
                          CVV / Security Code
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          placeholder="•••"
                          className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NETBANKING */}
              {activeTab === "netbanking" && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Select Your Bank
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { code: "HDFC", name: "HDFC Bank" },
                      { code: "SBI", name: "State Bank of India" },
                      { code: "ICICI", name: "ICICI Bank" },
                      { code: "AXIS", name: "Axis Bank" },
                      { code: "KOTAK", name: "Kotak Mahindra" },
                      { code: "PNB", name: "Punjab National Bank" },
                    ].map((bank) => (
                      <button
                        key={bank.code}
                        onClick={() => setSelectedBank(bank.code)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedBank === bank.code
                            ? "border-primary bg-primary/10 text-white shadow-sm"
                            : "border-white/10 bg-surface text-zinc-300 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xs font-bold block">{bank.code}</span>
                        <span className="text-[10px] text-zinc-400 block truncate">{bank.name}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-mono mb-1">
                      Or Choose Other Banks
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary"
                    >
                      <option value="HDFC">HDFC Bank</option>
                      <option value="SBI">State Bank of India (SBI)</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="AXIS">Axis Bank</option>
                      <option value="BOB">Bank of Baroda</option>
                      <option value="CANARA">Canara Bank</option>
                      <option value="UNION">Union Bank of India</option>
                      <option value="IDBI">IDBI Bank</option>
                      <option value="INDUSIND">IndusInd Bank</option>
                      <option value="YES">Yes Bank</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 4: COD */}
              {activeTab === "cod" && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Cash on Delivery (COD)
                    </span>
                  </div>

                  <div className="bg-surface p-4 rounded-xl border border-white/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Pay at your doorstep</h4>
                        <p className="text-[11px] text-zinc-400">
                          Hand over cash or scan delivery agent's UPI QR when your order arrives.
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] bg-canvas p-2.5 rounded-lg border border-white/5 text-zinc-300 font-mono">
                      Payable at Delivery: <span className="text-white font-bold">₹{orderTotal}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Box */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-3 border-t border-white/10">
                <button
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:bg-[#ff7a1a] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer text-xs uppercase tracking-wider"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                    </>
                  ) : activeTab === "upi" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirm Payment & Place Order (₹{orderTotal})
                    </>
                  ) : activeTab === "card" ? (
                    <>
                      <Lock className="w-4 h-4" /> Pay with Card (₹{orderTotal})
                    </>
                  ) : activeTab === "netbanking" ? (
                    <>
                      <Building2 className="w-4 h-4" /> Proceed to {selectedBank} Portal (₹{orderTotal})
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirm Cash On Delivery Order (₹{orderTotal})
                    </>
                  )}
                </button>
              </div>

              {/* Trust Footer */}
              <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> NPCI Verified</span>
                <span>•</span>
                <span>PCI-DSS Level 1</span>
                <span>•</span>
                <span>Instant Receipt</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
