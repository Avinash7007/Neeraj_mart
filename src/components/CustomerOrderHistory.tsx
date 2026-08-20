import React, { useEffect, useState } from "react";
import { authenticatedFetch } from "../utils/api";
import { Order } from "../types";
import { Package, RefreshCw, X, ChevronRight, Clock } from "lucide-react";

interface CustomerOrderHistoryProps {
  onClose: () => void;
}

export default function CustomerOrderHistory({ onClose }: CustomerOrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await authenticatedFetch("/api/orders");
        if (!response.ok) {
          throw new Error("Failed to fetch order history");
        }
        const data = await response.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleReorder = (order: Order) => {
    // create a custom event to notify App.tsx to add these items to cart
    const event = new CustomEvent("reorder-items", {
      detail: order.items
    });
    document.dispatchEvent(event);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Accepted":
      case "Preparing":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "OutForDelivery":
        return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "Completed":
      case "Delivered":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "Cancelled":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-surface border border-border-subtle w-full max-w-2xl rounded-xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border-subtle bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Order History</h2>
              <p className="text-xs text-zinc-400">View and track your past orders</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="animate-spin text-primary" size={24} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-zinc-500" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No Orders Yet</h3>
              <p className="text-sm text-zinc-400">You haven't placed any orders with us.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-canvas/50 border border-border-subtle rounded-xl p-4 sm:p-5 transition-colors hover:border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-mono text-sm font-semibold">{order.id}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock size={12} />
                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-white">₹{order.total}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{order.items.length} items • {order.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="bg-surface/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-zinc-300 line-clamp-2">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                    >
                      <RefreshCw size={14} />
                      Reorder Items
                    </button>
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
