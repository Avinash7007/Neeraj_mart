import { authenticatedFetch } from "../utils/api";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  ClipboardList,
  Sliders,
  Image,
  Plus,
  Trash2,
  Check,
  Edit2,
  Lock,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  X,
  PhoneCall,
  AlertTriangle
} from "lucide-react";
import { Product, StoreSettings, Order, Banner } from "../types";
import SaaSDashboard from "./SaaSDashboard";

interface AdminPanelProps {
  products: Product[];
  settings: StoreSettings;
  orders: Order[];
  banners: Banner[];
  onUpdateProducts: () => void;
  onUpdateSettings: (settings: StoreSettings) => void;
  onUpdateOrders: () => void;
  onUpdateBanners: () => void;
}

export default function AdminPanel({
  products,
  settings,
  orders,
  banners,
  onUpdateProducts,
  onUpdateSettings,
  onUpdateOrders,
  onUpdateBanners,
}: AdminPanelProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "orders" | "settings" | "banners"
  >("dashboard");

  // Create Product States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdHindi, setNewProdHindi] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Fruits & Vegetables");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdOrigPrice, setNewProdOrigPrice] = useState("");
  const [newProdUnit, setNewProdUnit] = useState("1 kg");
  const [newProdStock, setNewProdStock] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImg, setNewProdImg] = useState("");
  const [isPopular, setIsPopular] = useState(false);

  // Edit Product Mode
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  // Edit Settings states
  const [tempSettings, setTempSettings] = useState<StoreSettings>({ ...settings });
  React.useEffect(() => { setTempSettings(settings); }, [settings]);

  // Invoice Overlay States
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(
    null,
  );
  
  // Toast Notification State
  const [actionStatus, setActionStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setActionStatus({ message, type });
    setTimeout(() => setActionStatus(null), 3500);
  };

  // Order filters
  const [orderFilter, setOrderFilter] = useState<string>("All");

  // 1. PRODUCTS LOGIC
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProdName || !newProdPrice || !newProdStock) {
      alert("Missing product title, price, or stock levels!");
      return;
    }

    const payload = {
      name: newProdName,
      hindiName: newProdHindi,
      category: newProdCategory,
      price: parseFloat(newProdPrice),
      originalPrice: newProdOrigPrice
        ? parseFloat(newProdOrigPrice)
        : undefined,
      unit: newProdUnit,
      stock: parseInt(newProdStock, 10),
      imageUrl:
        newProdImg ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80",
      description: newProdDesc || "Premium quality item sourced locally.",
      isPopular: isPopular,
      isAvailable: true,
    };

    try {
      const response = await authenticatedFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onUpdateProducts(); // Refresh list in parent React state
        setShowAddForm(false);
        // Reset form variables
        setNewProdName("");
        setNewProdHindi("");
        setNewProdPrice("");
        setNewProdOrigPrice("");
        setNewProdUnit("1 kg");
        setNewProdStock("");
        setNewProdDesc("");
        setNewProdImg("");
        setIsPopular(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickUpdateProduct = async (productId: string) => {
    if (!editPrice || !editStock) return;

    try {
      const response = await authenticatedFetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseFloat(editPrice),
          stock: parseInt(editStock, 10),
        }),
      });

      if (response.ok) {
        onUpdateProducts();
        setEditingProductId(null);
        setEditPrice("");
        setEditStock("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePopular = async (product: Product) => {
    try {
      const newStatus = !product.isPopular;
      const resp = await authenticatedFetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPopular: newStatus }),
      });
      if (!resp.ok) throw new Error("Failed to update");
      await onUpdateProducts();
      showToast(`${product.name} popularity updated`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle product status", "error");
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    try {
      const newStatus = !product.isAvailable;
      const resp = await authenticatedFetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      if (!resp.ok) throw new Error("Failed to update availability");
      await onUpdateProducts();
      showToast(`${product.name} availability updated`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle product availability", "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (
      !confirm(
        "Are you absolutely sure you want to delete this product from the e-store?",
      )
    )
      return;

    try {
      const response = await authenticatedFetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onUpdateProducts();
        showToast("Product deleted successfully", "success");
      } else {
        throw new Error("Deletion failed");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete product", "error");
    }
  };

  // 2. ORDER DISPATCH LOGIC
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await authenticatedFetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        onUpdateOrders();
        showToast(`Order #${orderId} moved to '${status}'`, "success");
        // Update currently viewed invoice if open
        if (activeInvoiceOrder && activeInvoiceOrder.id === orderId) {
          setActiveInvoiceOrder((prev: any) => ({ ...prev, status }));
        }
      } else {
         throw new Error("Update failed");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update order status", "error");
    }
  };

  // 3. STORE SETTINGS SAVE
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tempSettings.storeName.trim() || !tempSettings.address.trim()) {
      showToast("Required fields cannot be empty", "error");
      return;
    }

    if (tempSettings.deliveryFee < 0 || tempSettings.freeDeliveryThreshold < 0) {
       showToast("Fees cannot be negative values", "error");
       return;
    }

    if (tempSettings.upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(tempSettings.upiId)) {
       showToast("Invalid UPI ID Format", "error");
       return;
    }

    for (const owner of tempSettings.owners || []) {
      if (!owner.name.trim() || !/^\d{10}$/.test(owner.phone)) {
        showToast("Invalid Owner details. Phone must be 10 digits.", "error");
        return;
      }
    }

    try {
      const response = await authenticatedFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempSettings),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdateSettings(data);
        showToast("Settings securely saved and applied!", "success");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save configuration settings", "error");
    }
  };

  // 4. BANNERS LOGIC
  const handleUpdateBannersInDb = async (
    index: number,
    key: string,
    val: string,
  ) => {
    const updatedBanners = [...banners];
    updatedBanners[index] = { ...updatedBanners[index], [key]: val };

    try {
      const response = await authenticatedFetch("/api/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBanners),
      });
      if (response.ok) {
        onUpdateBanners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter calculations
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "All") return true;
    return o.status === orderFilter;
  });

  // Calculate KPI Trends
  const now = new Date();

  const dailyOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const monthlyOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  const yearlyOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear();
  });

  const getSales = (arr: Order[]) =>
    arr
      .filter((o) => o.status === "Completed")
      .reduce((sum, o) => sum + o.total, 0);

  const dailySales = getSales(dailyOrders);
  const monthlySales = getSales(monthlyOrders);
  const yearlySales = getSales(yearlyOrders);
  const totalSales = getSales(orders);

  const totalCustomers = new Set(orders.map((o) => o.customerPhone)).size;

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative"
      id="admin-panel-container"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {actionStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-md text-[13px] font-medium tracking-wide flex items-center gap-2 ${
              actionStatus.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {actionStatus.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {actionStatus.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview stats strip */}
      <div className="mb-10">
        <div className="mb-6">
          <h2 className="text-xl font-medium text-[#FAFAFA] tracking-tight">
            Enterprise Console
          </h2>
          <p className="text-[13px] text-[#A1A1AA] mt-1">
            Global view of metrics, active pipeline, and platform configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-white/5 p-5 rounded-xl hover:border-white/10 transition-colors">
            <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold block mb-2">
              Total Volume
            </span>
            <span className="text-2xl font-medium text-[#FAFAFA] tracking-tight">
              ₹{totalSales}
            </span>
            <div className="mt-3 flex justify-between items-center text-[11px] text-[#A1A1AA] pt-3 border-t border-white/5">
              <span>
                Day:{" "}
                <span className="text-[#FAFAFA] font-medium">
                  ₹{dailySales}
                </span>
              </span>
              <span>
                Month:{" "}
                <span className="text-[#FAFAFA] font-medium">
                  ₹{monthlySales}
                </span>
              </span>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/5 p-5 rounded-xl hover:border-white/10 transition-colors">
            <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold block mb-2">
              Fulfillment Volume
            </span>
            <span className="text-2xl font-medium text-[#FAFAFA] tracking-tight">
              {orders.length}
            </span>
            <div className="mt-3 flex justify-between items-center text-[11px] text-[#A1A1AA] pt-3 border-t border-white/5">
              <span>
                Day:{" "}
                <span className="text-[#FAFAFA] font-medium">
                  {dailyOrders.length}
                </span>
              </span>
              <span>
                Month:{" "}
                <span className="text-[#FAFAFA] font-medium">
                  {monthlyOrders.length}
                </span>
              </span>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/5 p-5 rounded-xl hover:border-white/10 transition-colors">
            <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold block mb-2">
              Unique Accounts
            </span>
            <span className="text-2xl font-medium text-[#FAFAFA] tracking-tight">
              {totalCustomers}
            </span>
            <div className="mt-3 text-[10px] text-emerald-400 font-medium pt-3 border-t border-white/5">
              Active clients across network
            </div>
          </div>

          <div className="bg-[#111111] border border-[#FF6B00]/20 p-5 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-[#FF6B00] uppercase tracking-wider font-semibold block mb-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]"></div>{" "}
                Status
              </span>
              <span className="text-lg font-medium text-[#FAFAFA]">
                Operational
              </span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              All infrastructure segments are responding nominally.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tab Controls */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-3 border-b border-border-subtle w-max">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition-all duration-200 text-xs font-semibold ${
            activeTab === "dashboard"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition-all duration-200 text-xs font-semibold ${
            activeTab === "products"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Metrics & Products
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition-all duration-200 text-xs font-semibold ${
            activeTab === "orders"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Active Pipeline
        </button>
        <button
          onClick={() => {
            setActiveTab("settings");
            setTempSettings({ ...settings });
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition-all duration-200 text-xs font-semibold ${
            activeTab === "settings"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md whitespace-nowrap transition-all duration-200 text-xs font-semibold ${
            activeTab === "banners"
              ? "bg-white text-black shadow-sm"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-surface"
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          Display Assets
        </button>
      </div>

      {/* TAB CONTENTS */}

      {/* 0. ANALYTICS DASHBOARD CARD */}
      {activeTab === "dashboard" && (
        <SaaSDashboard products={products} orders={orders} />
      )}

      {/* 1. MANAGE PRODUCTS */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <h3 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              Product Repository
              <span className="text-[10px] bg-surface text-zinc-400 border border-border-subtle font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider">
                Live
              </span>
            </h3>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          </div>

          {/* New product sheet */}
          {showAddForm && (
            <form
              onSubmit={handleAddProduct}
              className="bg-surface border border-border-subtle rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 block shadow-sm"
              id="add-product-form"
            >
              <div className="col-span-1 md:col-span-4 pb-3 border-b border-border-subtle flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-100 tracking-wide flex items-center gap-2">
                  Create Product Record
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-zinc-500 hover:text-zinc-100 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  Display Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="Apples"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] focus:outline-none focus:border-[#FF6B00]/50 transition-all placeholder-[#71717A]/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  Secondary Label
                </label>
                <input
                  type="text"
                  placeholder="Optional..."
                  value={newProdHindi}
                  onChange={(e) => setNewProdHindi(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] focus:outline-none focus:border-[#FF6B00]/50 transition-all placeholder-[#71717A]/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  Category
                </label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] focus:outline-none focus:border-[#FF6B00]/50 transition-all"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Fruits & Vegetables">
                    Fruits & Vegetables
                  </option>
                  <option value="Dairy & Breakfast">Dairy & Breakfast</option>
                  <option value="Snacks & Munchies">Snacks & Munchies</option>
                  <option value="Cold Drinks & Juices">
                    Cold Drinks & Juices
                  </option>
                  <option value="Bakery & Biscuits">Bakery & Biscuits</option>
                  <option value="Atta, Rice & Dal">Atta, Rice & Dal</option>
                  <option value="Masala, Oil & More">Masala, Oil & More</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Cleaning Essentials">
                    Cleaning Essentials
                  </option>
                  <option value="Home & Needs">Home & Needs</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  Unit Price (INR)
                </label>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] font-mono focus:outline-none focus:border-[#FF6B00]/50 transition-all placeholder-[#71717A]/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  MSRP
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newProdOrigPrice}
                  onChange={(e) => setNewProdOrigPrice(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] font-mono focus:outline-none focus:border-[#FF6B00]/50 transition-all placeholder-[#71717A]/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  SKU Format
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 1 Box"
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] focus:outline-none focus:border-[#FF6B00]/50 transition-all placeholder-[#71717A]/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  Initial Stock
                </label>
                <input
                  required
                  type="number"
                  placeholder="100"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] font-mono focus:outline-none focus:border-[#FF6B00]/50 transition-all placeholder-[#71717A]/40"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  Asset Image (Upload)
                </label>
                <div className="flex items-center gap-3">
                  {newProdImg && <img src={newProdImg} alt="Preview" className="w-10 h-10 object-cover rounded-md border border-white/10" />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewProdImg(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2 text-[#FAFAFA] text-[13px] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-4">
                <label className="block text-[10px] font-semibold text-[#71717A] tracking-wide mb-1.5">
                  Technical Specifications
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Detailed description..."
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-md p-2.5 text-[#FAFAFA] text-[13px] focus:outline-none focus:border-[#FF6B00]/50 transition-all placeholder-[#71717A]/40"
                />
              </div>

              <div className="col-span-1 flex items-center mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="appearance-none w-4 h-4 border border-white/10 rounded bg-[#0a0a0a] checked:bg-[#FAFAFA] checked:border-[#FAFAFA] transition-all cursor-pointer peer"
                    />
                    <Check className="w-2.5 h-2.5 text-[#000000] absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <span className="text-[11px] font-medium text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors">
                    Highlight as Featured
                  </span>
                </label>
              </div>

              <div className="col-span-1 md:col-span-3 pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#FAFAFA] hover:bg-[#D4D4D8] text-[#000000] text-[11px] font-semibold py-2.5 px-6 rounded-full transition-all active:scale-[0.98] shadow-sm"
                >
                  Commit Entry
                </button>
              </div>
            </form>
          )}

          {/* Products List Grid */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400 border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-canvas border-b border-border-subtle uppercase tracking-wider text-[10px] font-bold text-zinc-500">
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4 text-center">Volume Let</th>
                    <th className="py-3 px-4 text-center">Unit Price</th>
                    <th className="py-3 px-4 text-center">Visibility</th>
                    <th className="py-3 px-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {products.map((p) => {
                    const isEditing = editingProductId === p.id;
                    const isLowStock = p.stock < 5;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-white/5 transition-colors group ${isLowStock ? "bg-red-500/5 bg-gradient-to-r from-red-500/10 to-transparent" : ""}`}
                      >
                        {/* Catalog Detail */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <img
                              src={p.imageUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className={`w-12 h-12 object-cover rounded bg-surface/80 border shrink-0 ${isLowStock ? "border-red-500/50" : "border-white/5"}`}
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] bg-white/5 text-[#9CA3AF] border border-white/10 font-medium px-2 py-0.5 rounded-full uppercase tracking-widest inline-block mb-1">
                                {p.category}
                              </span>
                              <h4 className="font-medium text-sm text-white flex items-center gap-2">
                                {p.name}
                                {isLowStock && (
                                  <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-500/30 uppercase tracking-widest">
                                    Low Stock
                                  </span>
                                )}
                              </h4>
                              {p.hindiName && (
                                <p className="text-xs text-[#9CA3AF] mt-0.5">
                                  {p.hindiName}
                                </p>
                              )}
                              <p className="text-[10px] text-[#9CA3AF]/70 font-mono mt-1 uppercase tracking-widest">
                                SKU: {p.id.substring(0, 6)} • {p.unit}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Stock Level column */}
                        <td className="py-4 px-5 text-center font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="w-20 border border-primary/50 rounded p-1.5 text-center bg-primary/10 text-primary font-medium text-sm focus:outline-none"
                            />
                          ) : (
                            <span
                              className={`font-medium px-2.5 py-1 rounded-md border text-[11px] uppercase tracking-wider ${
                                p.stock <= 0
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : p.stock < 10
                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {p.stock} Units
                            </span>
                          )}
                        </td>

                        {/* Selling Price column */}
                        <td className="py-4 px-5 text-center font-mono font-medium text-white">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-[#9CA3AF]">₹</span>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-20 border border-primary/50 rounded p-1.5 text-center bg-primary/10 text-primary font-medium text-sm focus:outline-none"
                              />
                            </div>
                          ) : (
                            <span className="text-base">₹{p.price}</span>
                          )}
                        </td>

                        {/* Quick options toggles */}
                        <td className="py-4 px-5 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <button
                                  onClick={() => handleQuickUpdateProduct(p.id)}
                                  className="bg-primary text-white rounded p-1.5 hover:bg-[#ff7a1a] cursor-pointer shadow-[0_0_10px_rgba(255,107,0,0.3)] transition"
                                  title="Save edits"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingProductId(p.id);
                                    setEditPrice(p.price.toString());
                                    setEditStock(p.stock.toString());
                                  }}
                                  className="text-[#9CA3AF] hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded p-1.5 transition-colors cursor-pointer"
                                  title="Quick Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button" onClick={(e) => { e.preventDefault(); handleTogglePopular(p); }}
                                className={`text-[10px] font-medium px-2 py-1 rounded cursor-pointer transition-colors uppercase tracking-widest ${
                                  p.isPopular
                                    ? "bg-primary/10 text-primary border border-primary/30"
                                    : "bg-white/5 text-[#9CA3AF] hover:text-white border border-transparent"
                                }`}
                              >
                                Featured
                              </button>
                            </div>

                            <button
                              type="button" onClick={(e) => { e.preventDefault(); handleToggleAvailable(p); }}
                              className={`text-[10px] font-medium px-2.5 py-1 rounded cursor-pointer transition-colors uppercase tracking-widest ${
                                p.isAvailable
                                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                                  : "text-zinc-400 bg-white/10 border border-white/20 hover:bg-white/20"
                              }`}
                            >
                              {p.isAvailable ? "Active" : "Disabled"}
                            </button>
                          </div>
                        </td>

                        {/* Delete */}
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-[#9CA3AF]/50 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. LIVE INCOMING ORDERS */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-xl font-medium text-white tracking-tight flex items-center gap-2">
              Delivery Pipeline
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-mono px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                Live Socket
              </span>
            </h3>

            {/* Filter Pills */}
            <div className="flex gap-2 text-xs font-medium bg-surface/50 p-1 rounded-lg border border-white/5">
              {[
                "All",
                "Placed",
                "Accepted",
                "Preparing",
                "Ready",
                "Delivered",
                "Cancelled",
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    if (status === "Placed") setOrderFilter("Pending");
                    else if (status === "Delivered") setOrderFilter("Completed");
                    else setOrderFilter(status);
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    (orderFilter === "Pending" && status === "Placed") ||
                    (orderFilter === "Completed" && status === "Delivered") ||
                    orderFilter === status
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-[#9CA3AF] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {filteredOrders.length === 0 ? (
                <div className="py-16 p-4 text-center flex flex-col items-center bg-surface/30">
                  <span className="text-4xl opacity-50">📭</span>
                  <h4 className="text-white font-medium mt-4">
                    Pipeline Empty
                  </h4>
                  <p className="text-sm text-[#9CA3AF] mt-1">
                    No transactions match the current filter state.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-[#9CA3AF] border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 uppercase tracking-widest text-[10px] font-medium text-[#9CA3AF]">
                      <th className="py-4 px-5">Identifier / Entity</th>
                      <th className="py-4 px-5">Delivery Coordinates</th>
                      <th className="py-4 px-5 text-center">Protocol</th>
                      <th className="py-4 px-5 text-center">Volume</th>
                      <th className="py-4 px-5 text-center">State</th>
                      <th className="py-4 px-5 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-transparent">
                    {filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        {/* Client details */}
                        <td className="py-4 px-5">
                          <span className="font-mono text-sm text-white tracking-widest">
                            {o.id.substring(0, 8)}...
                          </span>
                          <h4 className="font-medium text-white mt-1 text-sm">
                            {o.customerName}
                          </h4>
                          <a
                            href={`tel:${o.customerPhone}`}
                            className="text-xs text-primary hover:text-[#ff7a1a] transition-colors flex items-center gap-1.5 mt-1"
                          >
                            <PhoneCall className="w-3 h-3" />
                            {o.customerPhone}
                          </a>
                          <p className="text-[10px] text-[#9CA3AF]/60 font-mono mt-1.5 uppercase tracking-widest">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </p>
                        </td>

                        {/* Address */}
                        <td className="py-4 px-5">
                          <p className="text-xs text-[#9CA3AF] max-w-xs line-clamp-2 leading-relaxed">
                            {o.customerAddress}
                          </p>
                        </td>

                        {/* payment method */}
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-medium tracking-widest border ${
                              o.paymentMethod === "UPI"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {o.paymentMethod}
                          </span>
                        </td>

                        {/* Grand Total */}
                        <td className="py-4 px-5 text-center font-mono text-white text-base">
                          ₹{o.total}
                        </td>

                        {/* dispatch state selectors */}
                        <td className="py-4 px-5 text-center">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(o.id, e.target.value)
                            }
                            className={`text-xs font-semibold rounded-md p-1.5 text-center focus:outline-none border border-white/10 appearance-none cursor-pointer tracking-wider uppercase ${
                              o.status === "Pending"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : o.status === "Accepted"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : o.status === "Preparing"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : o.status === "Ready"
                                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                      : o.status === "Completed"
                                        ? "bg-[#FF6B00]/10 text-primary border-[#FF6B00]/20"
                                        : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            <option
                              className="bg-surface text-white"
                              value="Pending"
                            >
                              Placed
                            </option>
                            <option
                              className="bg-surface text-white"
                              value="Accepted"
                            >
                              Accepted
                            </option>
                            <option
                              className="bg-surface text-white"
                              value="Preparing"
                            >
                              Preparing
                            </option>
                            <option
                              className="bg-surface text-white"
                              value="Ready"
                            >
                              Ready
                            </option>
                            <option
                              className="bg-surface text-white"
                              value="OutForDelivery"
                            >
                              OutForDelivery
                            </option>
                            <option
                              className="bg-surface text-white"
                              value="Completed"
                            >
                              Delivered
                            </option>
                            <option
                              className="bg-surface text-white"
                              value="Cancelled"
                            >
                              Cancelled
                            </option>
                          </select>
                        </td>

                        {/* Print Invoice review */}
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => setActiveInvoiceOrder(o)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-1.5 px-3 rounded-md text-[10px] font-medium tracking-widest uppercase cursor-pointer transition-colors flex items-center gap-1.5 mx-auto"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. STORE SETUP CONFIG */}
      {activeTab === "settings" && (
        <form
          onSubmit={handleSaveSettings}
          className="glass-panel border-t-2 border-t-zinc-700 shadow-sm rounded-2xl p-8 space-y-6 relative overflow-hidden"
        >
          <h3 className="text-xl font-bold text-zinc-100 tracking-tight pb-4 border-b border-border-subtle flex items-center gap-2">
            <Sliders className="w-5 h-5 text-zinc-400" />
            Environment Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 text-sm">
            {/* Store Information Section */}
            <div className="space-y-6 md:col-span-2 md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0">
              <div className="md:col-span-2 mb-4 md:mb-6">
                <h4 className="text-sm font-bold text-zinc-100 tracking-widest uppercase mb-1">Store Information</h4>
                <p className="text-xs text-zinc-500">Core entity details and branding.</p>
              </div>
            
            <div>
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                Entity Designation
              </label>
              <input
                type="text"
                required
                value={tempSettings.storeName}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    storeName: e.target.value,
                  })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                System Tagline
              </label>
              <input
                type="text"
                required
                value={tempSettings.tagline}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, tagline: e.target.value })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                Central Headquarters Address *
              </label>
              <input
                type="text"
                required
                value={tempSettings.address}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, address: e.target.value })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                Routing Area Code
              </label>
              <input
                type="text"
                required
                value={tempSettings.pincode}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, pincode: e.target.value })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            </div>
            {/* Logistics & Delivery */}
            <div className="space-y-6 md:col-span-2 border-t border-border-subtle pt-8 mt-2 md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0">
              <div className="md:col-span-2 mb-4 md:mb-6">
                <h4 className="text-sm font-bold text-zinc-100 tracking-widest uppercase mb-1">Delivery Logistics</h4>
                <p className="text-xs text-zinc-500">Fulfillment threshold restrictions and fees.</p>
              </div>
            <div>
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                Standard Fulfillment Fee (INR)
              </label>
              <input
                type="number"
                required
                value={tempSettings.deliveryFee}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    deliveryFee: parseInt(e.target.value, 10),
                  })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                Free Fulfillment Threshold (INR)
              </label>
              <input
                type="number"
                required
                value={tempSettings.freeDeliveryThreshold}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    freeDeliveryThreshold: parseInt(e.target.value, 10),
                  })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            </div>
            {/* Payment & Offers */}
            <div className="space-y-6 md:col-span-2 border-t border-border-subtle pt-8 mt-2 md:grid md:grid-cols-2 md:gap-x-8 md:space-y-0">
              <div className="md:col-span-2 mb-4 md:mb-6">
                <h4 className="text-sm font-bold text-zinc-100 tracking-widest uppercase mb-1">Payments & Comm</h4>
                <p className="text-xs text-zinc-500">Payment gateways and global announcements.</p>
              </div>
            <div>
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                Payment Gateway Identity *
              </label>
              <input
                type="text"
                required
                value={tempSettings.upiId}
                onChange={(e) =>
                  setTempSettings({ ...tempSettings, upiId: e.target.value })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white font-mono focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Alert/Ticker message */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                Global System Announcement (Active ticker)
              </label>
              <input
                type="text"
                value={tempSettings.announcement}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    announcement: e.target.value,
                  })
                }
                className="w-full bg-surface/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Owner accounts */}
            </div>
            <div className="md:col-span-2 border-t border-border-subtle pt-8 mt-2">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-widest mb-4">
                Administrative Contacts (Publicly Visible)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tempSettings.owners.map((owner, idx) => (
                  <div
                    key={idx}
                    className="border border-border-subtle p-5 rounded-2xl bg-surface flex flex-col gap-3"
                  >
                    <span className="font-medium text-white/50 font-mono text-[10px] uppercase tracking-wider">
                      Stakeholder {idx + 1}
                    </span>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Stakeholder Name"
                        value={owner.name}
                        onChange={(e) => {
                          const updatedOwners = [...tempSettings.owners];
                          updatedOwners[idx].name = e.target.value;
                          setTempSettings({
                            ...tempSettings,
                            owners: updatedOwners,
                          });
                        }}
                        className="w-1/2 bg-surface border border-white/10 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-primary/50 transition-colors placeholder-[#9CA3AF]/40"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Contact Number"
                        value={owner.phone}
                        onChange={(e) => {
                          const updatedOwners = [...tempSettings.owners];
                          updatedOwners[idx].phone = e.target.value;
                          setTempSettings({
                            ...tempSettings,
                            owners: updatedOwners,
                          });
                        }}
                        className="w-1/2 bg-surface border border-white/10 rounded-lg p-2.5 text-white text-xs font-mono focus:outline-none focus:border-primary/50 transition-colors placeholder-[#9CA3AF]/40"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border-subtle flex justify-end">
            <button
              type="submit"
              className="bg-white hover:bg-zinc-200 text-black font-bold text-sm py-3 px-8 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Deploy Configuration
            </button>
          </div>
        </form>
      )}

      {/* 4. EDIT BANNERS */}
      {activeTab === "banners" && (
        <div className="glass-panel border-t-2 border-t-zinc-700 shadow-sm rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-bold text-zinc-100 tracking-tight pb-4 border-b border-border-subtle flex items-center gap-2">
            <Image className="w-5 h-5 text-zinc-400" />
            Marketing Campaigns Assets
          </h3>

          <div className="space-y-6">
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                className="border border-border-subtle rounded-2xl p-6 bg-surface grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="md:col-span-3 flex justify-between items-center pb-3 border-b border-border-subtle">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#ffb703] shadow-[0_0_6px_#ffb703]"></div>
                    Campaign Index 00{idx + 1}
                  </span>
                </div>

                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                      Primary Headline
                    </label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      value={banner.title}
                      onChange={(e) =>
                        handleUpdateBannersInDb(idx, "title", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                      Secondary Proposition
                    </label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      value={banner.subtitle || ""}
                      onChange={(e) =>
                        handleUpdateBannersInDb(idx, "subtitle", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1.5">
                      High-Resolution Asset (Upload)
                    </label>
                    <div className="flex items-center gap-3">
                      {banner.imageUrl && <img src={banner.imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-white/10" />}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleUpdateBannersInDb(idx, "imageUrl", reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full bg-surface border border-white/10 rounded-lg p-2 text-white text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center border border-white/10 rounded-lg overflow-hidden bg-black/50 relative max-h-40 col-span-3">
                  <img
                    src={banner.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <span className="absolute bottom-2 left-2 bg-primary/20 backdrop-blur-md text-primary border border-primary/30 font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-widest">
                    Asset Preview Mode
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RETAIL CUSTOMER INVOICE DOCUMENT MODAL POPUP */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel border-2 border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8 flex flex-col relative">
            <button
              onClick={() => setActiveInvoiceOrder(null)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt invoice details */}
            <div
              className="border border-white/10 rounded-xl p-6 space-y-5 text-white bg-surface/50 font-sans"
              id="print-sheet-content"
            >
              {/* Header */}
              <div className="text-center border-b border-white/10 pb-4">
                <h3 className="text-white font-medium text-xl block tracking-tight">
                  {settings.storeName}
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  {settings.address}, Global
                </p>

                <div className="bg-primary/10 p-1 px-3 border border-primary/20 rounded inline-block mt-4 text-[10px] font-mono uppercase tracking-widest text-primary">
                  System Generated Invoice
                </div>
              </div>

              {/* Order and Client stats */}
              <div className="grid grid-cols-2 text-xs border-b border-dashed border-white/10 pb-4 gap-y-3">
                <div>
                  <span className="text-[#9CA3AF] font-mono block text-[10px] uppercase tracking-widest mb-0.5">
                    Order Token:
                  </span>
                  <span className="font-mono text-white text-sm tracking-wider">
                    {activeInvoiceOrder.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#9CA3AF] font-mono block text-[10px] uppercase tracking-widest mb-0.5">
                    Timestamp:
                  </span>
                  <span className="text-white opacity-90">
                    {new Date(activeInvoiceOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] font-mono block text-[10px] uppercase tracking-widest mb-0.5">
                    Client Identity:
                  </span>
                  <span className="font-medium text-white">
                    {activeInvoiceOrder.customerName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#9CA3AF] font-mono block text-[10px] uppercase tracking-widest mb-0.5">
                    Contact Link:
                  </span>
                  <span className="font-medium text-white">
                    {activeInvoiceOrder.customerPhone}
                  </span>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="text-[#9CA3AF] font-mono block text-[10px] uppercase tracking-widest mb-0.5">
                    Delivery Coordinates:
                  </span>
                  <p className="text-white/80 text-[11px] leading-relaxed">
                    {activeInvoiceOrder.customerAddress}
                  </p>
                </div>
              </div>

              {/* Items details table */}
              <div>
                <span className="text-[10px] font-medium uppercase text-[#9CA3AF] tracking-widest font-mono block mb-3">
                  Authorized Item Manifest
                </span>
                <div className="space-y-2 border-b border-dashed border-white/10 pb-4">
                  {activeInvoiceOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-baseline text-xs"
                    >
                      <span className="text-white/90 max-w-xs truncate">
                        {item.name}{" "}
                        <span className="text-[#9CA3AF] opacity-80">
                          x{item.quantity} ({item.unit})
                        </span>
                      </span>
                      <span className="font-mono text-white font-medium">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Subtotal Matrix:</span>
                  <span className="font-mono text-white/90">
                    ₹{activeInvoiceOrder.subtotal}
                  </span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Fulfillment Premium:</span>
                  <span className="font-mono text-white/90">
                    {activeInvoiceOrder.deliveryFee === 0
                      ? "WAIVED"
                      : `₹${activeInvoiceOrder.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-white font-medium text-sm pt-2 mt-1 border-t border-white/10">
                  <span>Gross Valuation (INR):</span>
                  <span className="font-mono text-primary text-base">
                    ₹{activeInvoiceOrder.total}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="pt-3 flex justify-between items-center text-xs border-t border-white/5 mt-1">
                <span className="text-[#9CA3AF] uppercase font-mono text-[9px] tracking-widest">
                  Transaction State:
                </span>
                <span className="font-medium px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeInvoiceOrder.status}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-primary hover:bg-[#ff7a1a] text-white font-medium text-xs py-3 rounded-lg uppercase tracking-widest transition-all cursor-pointer text-center shadow-[0_0_15px_rgba(255,107,0,0.2)] active:scale-[0.98]"
              >
                Print Hardcopy
              </button>
              <button
                onClick={() => setActiveInvoiceOrder(null)}
                className="flex-1 bg-surface border border-white/10 hover:bg-white/5 text-white font-medium text-xs py-3 rounded-lg uppercase tracking-widest transition-all cursor-pointer text-center"
              >
                Close Visualizer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
