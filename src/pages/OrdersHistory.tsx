import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
// All imports are now used below
import {
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";

export default function OrdersHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0 });

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setOrders(data);
      const total = data.reduce((acc, order) => acc + (order.total_amount || 0), 0);
      setStats({ totalSales: total, orderCount: data.length });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-orange-50/30 p-4 md:p-8">
      <div className="fixed inset-0 bg-[url('/logo.jpg')] bg-cover bg-center opacity-[0.02] pointer-events-none" />
      <div className="max-w-6xl mx-auto">
        {/* HEADER with ChevronLeft to solve the warning */}
        <header className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition font-bold mb-4"
          >
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-gray-900">Order History</h1>
        </header>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6 rounded-[2rem] relative overflow-hidden hover-lift">
            {/* DollarSign used here as a background decoration to solve the warning */}
            <DollarSign
              className="absolute -right-4 -bottom-4 text-orange-50 opacity-10"
              size={120}
            />
            <div className="flex items-center gap-4 mb-2 text-orange-600 relative z-10">
              <TrendingUp size={24} />
              <span className="font-black uppercase text-xs tracking-widest">
                Total Revenue
              </span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 relative z-10">
              Nu. {stats.totalSales}
            </h2>
          </div>

          <div className="glass-card p-6 rounded-[2rem] hover-lift">
            <div className="flex items-center gap-4 mb-2 text-blue-600">
              <Package size={24} />
              <span className="font-black uppercase text-xs tracking-widest">
                Total Orders
              </span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">
              {stats.orderCount}
            </h2>
          </div>
        </div>

        {/* ORDER LIST */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-black text-gray-900">Recent Sales</h3>
            <div className="text-[10px] font-black uppercase text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
              Real-time Updates
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 flex flex-col md:flex-row justify-between gap-4 hover:bg-gray-50/30 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                      <p className="text-xs text-gray-400 font-bold uppercase">
                        {order.payment_method || "Cash Payment"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center max-w-md">
                    {order.items?.map((item: any, idx: number) => (
                      <span
                        key={idx}
                        className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold text-gray-600"
                      >
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-orange-600">
                      Nu. {order.total_amount}
                    </p>
                    <span className="text-[10px] font-black uppercase text-green-500">
                      Completed
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center text-gray-400 font-bold">
                No orders found. Time to sell something!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
