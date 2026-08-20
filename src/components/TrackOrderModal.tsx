import { authenticatedFetch } from "../utils/api";
import React, { useState } from 'react';
import { X, Search, MapPin, CheckCircle2, Clock, Truck } from 'lucide-react';
import { Order } from '../types';

interface TrackOrderModalProps {
  onClose: () => void;
}

export default function TrackOrderModal({ onClose }: TrackOrderModalProps) {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedId = orderId.trim();
    if (cleanedId.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(cleanedId)}`);
      if (res.status === 404) {
        setError("No active order found with this tracking token.");
        setOrderData(null);
        return;
      }
      if (!res.ok) throw new Error("Server error");
      const found: Order = await res.json();
      setOrderData(found);
    } catch(err) {
      setError("Network timeout trying to reach the node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md glass-panel border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
          <div>
            <span className="text-primary font-medium text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#ff6b00]"></div>
              Real-time Locator
            </span>
            <h2 className="text-lg font-medium text-white tracking-tight">Order Tracking</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!orderData ? (
             <form onSubmit={handleTrack} className="space-y-4">
               <div>
                 <label className="block text-[10px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-2">
                   Tracking Token ID
                 </label>
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                   <input
                     type="text"
                     value={orderId}
                     onChange={(e) => setOrderId(e.target.value)}
                     className="w-full bg-surface/80 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 transition-colors text-sm font-mono placeholder:font-sans placeholder-[#9CA3AF]/40"
                     placeholder="e.g. NG-5011"
                   />
                 </div>
               </div>
   
               {error && (
                 <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-400 text-xs rounded-lg flex items-center gap-2">
                    <span className="font-mono bg-red-400/20 px-1 py-0.5 rounded text-[10px]">ERR</span>
                    {error}
                 </div>
               )}
   
               <button
                 type="submit"
                 disabled={loading || !orderId.trim()}
                 className="w-full bg-primary hover:bg-[#ff7a1a] disabled:opacity-50 disabled:hover:bg-primary text-white font-medium py-3 cursor-pointer rounded-lg transition-all shadow-[0_0_15px_rgba(255,107,0,0.2)] active:scale-[0.98] uppercase tracking-widest text-xs mt-2"
               >
                 {loading ? "Querying Server..." : "Trace Coordinates"}
               </button>
             </form>
          ) : (
             <div className="space-y-6">
                <div className="bg-surface/50 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                      <span className="block text-[10px] text-[#9CA3AF] uppercase tracking-widest mb-1 font-mono">Matched Record</span>
                      <span className="text-sm font-mono text-white tracking-widest">{orderData.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-[#9CA3AF] uppercase tracking-widest mb-1 font-mono">Status</span>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-widest border border-white/10 inline-block ${
                        orderData.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        orderData.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {orderData.status}
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-4 pb-2">
                    {/* Status timeline */}
                    <div className="absolute left-[15px] top-6 bottom-4 w-0.5 bg-white/5"></div>
                    
                    <div className="space-y-6 relative">
                      <div className="flex gap-4 items-start relative z-10">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-white mb-0.5">Sequence Initialized</h4>
                          <p className="text-[10px] text-[#9CA3AF] uppercase font-mono tracking-wider">{new Date(orderData.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${orderData.status !== 'Pending' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface border-white/10 text-[#9CA3AF]'}`}>
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-medium ${orderData.status !== 'Pending' ? 'text-white' : 'text-[#9CA3AF]'} mb-0.5`}>Dispatch in Progress</h4>
                          <p className="text-[10px] text-[#9CA3AF]/50 uppercase font-mono tracking-wider">
                            {orderData.status !== 'Pending' ? "Package en route to coordinates" : "Awaiting carrier pickup"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${orderData.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-surface border-white/10 text-[#9CA3AF]'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className={`text-xs font-medium ${orderData.status === 'Completed' ? 'text-white' : 'text-[#9CA3AF]'} mb-0.5`}>Delivery Confirmed</h4>
                          <p className="text-[10px] text-[#9CA3AF]/50 uppercase font-mono tracking-wider">
                            {orderData.status === 'Completed' ? "Arrived at destination" : "Pending final handover"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface/50 border border-white/10 rounded-xl p-4 text-xs">
                   <div className="flex justify-between items-center text-[#9CA3AF] mb-1">
                     <span className="uppercase tracking-widest text-[10px]">Client Identity</span>
                     <span className="font-medium text-white/90">{orderData.customerName}</span>
                   </div>
                   <div className="flex justify-between items-center text-[#9CA3AF] mb-3 border-b border-white/5 pb-3">
                     <span className="uppercase tracking-widest text-[10px]">Gross Valuation</span>
                     <span className="font-mono text-primary font-medium text-sm">₹{orderData.total}</span>
                   </div>
                   <p className="text-[#9CA3AF] leading-relaxed break-words line-clamp-2" title={orderData.customerAddress}>
                     <span className="block uppercase tracking-widest text-[10px] mb-1">Delivery Vector:</span>
                     {orderData.customerAddress}
                   </p>
                </div>

                <button
                  onClick={() => {
                    document.dispatchEvent(new CustomEvent("reorder-items", { detail: orderData.items }));
                    // Emit a success message / popup indicator
                    alert("Items appended to cart! Proceeding to checkout.");
                    onClose();
                  }}
                  className="w-full bg-primary hover:bg-[#ff7a1a] text-white font-bold py-3.5 cursor-pointer rounded-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,107,0,0.2)] active:scale-95 mb-2"
                >
                  ♻️ Fast Reorder Items
                </button>

                <button
                  onClick={() => { setOrderData(null); setOrderId(''); }}
                  className="w-full bg-surface border border-white/10 hover:bg-white/5 text-white font-medium py-3 cursor-pointer rounded-lg transition-all uppercase tracking-widest text-xs"
                >
                  Query Another Token
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
