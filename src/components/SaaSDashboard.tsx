import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  IndianRupee,
  Package,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Product, Order } from "../types";

interface SaaSDashboardProps {
  products: Product[];
  orders: Order[];
}

export default function SaaSDashboard({ products, orders }: SaaSDashboardProps) {
  // 1. Core Financial Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const getDaySales = () => {
      return orders
        .filter((o) => {
          const d = new Date(o.createdAt);
          return (
            d.toDateString() === todayStr &&
            o.status !== "Cancelled"
          );
        })
        .reduce((sum, o) => sum + o.total, 0);
    };

    const getWeekSales = () => {
      const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      return orders
        .filter((o) => {
          const d = new Date(o.createdAt);
          return d.getTime() >= oneWeekAgo && o.status !== "Cancelled";
        })
        .reduce((sum, o) => sum + o.total, 0);
    };

    const getMonthSales = () => {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      return orders
        .filter((o) => {
          const d = new Date(o.createdAt);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== "Cancelled";
        })
        .reduce((sum, o) => sum + o.total, 0);
    };

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === "Pending" || o.status === "Placed" || o.status === "Accepted" || o.status === "Preparing"
    ).length;
    
    const deliveredOrders = orders.filter(
      (o) => o.status === "Completed" || o.status === "Delivered"
    ).length;

    // Inventory Health alert (< 10 stock)
    const lowStockItems = products.filter((p) => p.isAvailable && p.stock < 10);
    const criticalStockItems = products.filter((p) => p.isAvailable && p.stock === 0);

    return {
      todayRevenue: getDaySales(),
      weeklyRevenue: getWeekSales(),
      monthlyRevenue: getMonthSales(),
      totalOrders,
      pendingOrders,
      deliveredOrders,
      lowStockCount: lowStockItems.length,
      criticalStockCount: criticalStockItems.length,
      lowStockProducts: lowStockItems,
    };
  }, [products, orders]);

  // 2. Revenue Trend Grouped Last 7 Days
  const revenueTrendData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = Date.now();
    const map: { [key: string]: number } = {};

    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 3600 * 1000);
      map[date.toDateString()] = 0;
    }

    orders.forEach((o) => {
      const oDate = new Date(o.createdAt).toDateString();
      if (map[oDate] !== undefined && o.status !== "Cancelled") {
        map[oDate] += o.total;
      }
    });

    return Object.entries(map).map(([dateStr, sales]) => {
      const date = new Date(dateStr);
      return {
        label: `${days[date.getDay()]} ${date.getDate()}`,
        revenue: sales,
      };
    });
  }, [orders]);

  // 3. Category Sales Distribution
  const categoryChartData = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    orders.forEach((o) => {
      if (o.status === "Cancelled") return;
      o.items.forEach((item) => {
        // Resolve category from products list
        const p = products.find((prod) => prod.id === item.productId);
        const cat = p ? p.category : "Category-wise";
        dataMap[cat] = (dataMap[cat] || 0) + item.price * item.quantity;
      });
    });

    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products, orders]);

  // 4. Order Status Frequency Distribution
  const statusChartData = useMemo(() => {
    const list = [
      { name: "Placed", count: 0, color: "#FFB703" },
      { name: "Accepted", count: 0, color: "#10B981" },
      { name: "Preparing", count: 0, color: "#3B82F6" },
      { name: "Ready", count: 0, color: "#8B5CF6" },
      { name: "Delivered", count: 0, color: "#FF6B00" },
      { name: "Cancelled", count: 0, color: "#EF4444" },
    ];

    orders.forEach((o) => {
      // support both legacy statuses
      let status = o.status;
      if (status === "Pending") status = "Placed";
      if (status === "Completed") status = "Delivered";

      const idx = list.findIndex(
        (item) => item.name.toLowerCase() === status.toLowerCase()
      );
      if (idx !== -1) {
        list[idx].count += 1;
      }
    });

    return list.filter((s) => s.count > 0);
  }, [orders]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const freq: { [key: string]: { name: string; qty: number; sales: number } } = {};
    orders.forEach((o) => {
      if (o.status === "Cancelled") return;
      o.items.forEach((item) => {
        if (!freq[item.productId]) {
          freq[item.productId] = { name: item.name, qty: 0, sales: 0 };
        }
        freq[item.productId].qty += item.quantity;
        freq[item.productId].sales += item.price * item.quantity;
      });
    });

    return Object.values(freq)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-8 pb-10" id="saas-dashboard-panel">
      {/* Upper Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-primary/50 hover:shadow-xl transition-all duration-300 bg-surface">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Today's Net Pipeline
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-primary">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              ₹{metrics.todayRevenue}
            </h3>
            <p className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> All active orders today
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-[#FFB703]/50 hover:shadow-xl transition-all duration-300 bg-surface">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Weekly Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FFB703]/10 flex items-center justify-center text-[#FFB703]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              ₹{metrics.weeklyRevenue}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1 uppercase tracking-wider">
              Last 7 Days Rolling
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 bg-surface">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Active Pipeline Flows
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {metrics.pendingOrders} / {metrics.totalOrders}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1 uppercase tracking-wider">
              Pending vs Total orders
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between group hover:border-red-500/50 hover:shadow-xl transition-all duration-300 bg-surface">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Inventory Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-red-500 tracking-tight">
              {metrics.lowStockCount} alert{metrics.lowStockCount !== 1 ? "s" : ""}
            </h3>
            <p className="text-[10px] text-red-400 font-mono mt-1 flex items-center gap-1 uppercase tracking-wider">
              Stock items below 10
            </p>
          </div>
        </div>
      </div>

      {/* Double Column Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Revenue trends */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h4 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">
              Financial Velocity Trend
            </h4>
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase">
              Daily aggregates
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#71717A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717A"
                  fontSize={11}
                  tickFormatter={(v) => `₹${v}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111111",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#FAFAFA", fontSize: "12px" }}
                  labelStyle={{ color: "#A1A1AA", fontSize: "11px" }}
                  formatter={(v) => [`₹${v}`, "Gross Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF6B00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Col 3: Status Breakdown distribution */}
        <div className="glass-panel p-8 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h4 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">
              Pipeline State Distribution
            </h4>
          </div>

          {statusChartData.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-8 text-[#A1A1AA] text-xs">
              <ShoppingBag className="w-8 h-8 opacity-45 mb-2" />
              <span>No orders found in pipeline</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <XAxis
                      dataKey="name"
                      stroke="#71717A"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#71717A" fontSize={10} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "#FAFAFA", fontSize: "12px" }}
                      formatter={(v) => [v, "Count"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {statusChartData.map((st) => (
                  <div key={st.name} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: st.color }}
                    ></span>
                    <span className="text-zinc-400 capitalize">{st.name}:</span>
                    <span className="font-bold text-white">{st.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts & Performance Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical/Low Stock Inventory Health list */}
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h4 className="text-sm font-bold text-zinc-100 tracking-wide uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Low Stock Alerts (<span className="text-zinc-300 font-mono">{metrics.lowStockCount}</span>)
            </h4>
            <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-widest bg-red-400/5 px-2 py-0.5 border border-red-500/10 rounded-sm">
              Action Required
            </span>
          </div>

          {metrics.lowStockProducts.length === 0 ? (
            <div className="py-12 text-center text-[#A1A1AA] text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500 opacity-80 mx-auto mb-2" />
              <span>All inventory stock parameters normal! No warnings pending.</span>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[280px] overflow-y-auto no-scrollbar pr-1">
              {metrics.lowStockProducts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-contain bg-[#111111] border border-white/5"
                    />
                    <div>
                      <span className="block text-xs font-semibold text-white leading-relaxed line-clamp-1">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                        {p.category} | {p.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`block font-mono text-xs font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-400"}`}>
                      {p.stock === 0 ? "OUT OF STOCK" : `${p.stock} units`}
                    </span>
                    <span className="text-[9px] text-[#A1A1AA] lowercase">
                      per {p.unit} unit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Product Movers */}
        <div className="glass-panel p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h4 className="text-sm font-bold text-zinc-100 tracking-wide uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Top Sensation Movers
            </h4>
            <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider">
              By Gross Value
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-[#A1A1AA] text-xs">
              <Package className="w-8 h-8 opacity-45 mx-auto mb-2" />
              <span>Movers index will compile once orders are processed.</span>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {topProducts.map((p, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-[11px] font-bold text-zinc-500 font-mono w-4">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-white line-clamp-1">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Processed volume: {p.qty} orders
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-bold text-[#FAFAFA] font-mono">
                      ₹{p.sales}
                    </span>
                    <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-mono">
                      High Flow
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
