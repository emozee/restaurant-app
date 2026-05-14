import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Loader2,
  Phone,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Table2,
  User,
  UtensilsCrossed,
} from "lucide-react";

type Order = {
  id: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  items?: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  order_type?: string;
  status?: string;
  table_number?: number | null;
  total_amount?: number;
};

type OrderGroup = {
  key: string;
  label: string;
  kind: "table" | "takeaway" | "dine-in";
  orders: Order[];
  total: number;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  cooking: "bg-orange-50 text-orange-700",
  completed: "bg-green-50 text-green-700",
};

function formatStatus(status?: string) {
  return (status || "pending").replace("-", " ");
}

function combineItems(orders: Order[]) {
  const itemMap = new Map<string, { name: string; quantity: number; total: number }>();

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      const key = `${item.name}-${Number(item.price)}`;
      const existing = itemMap.get(key);
      const quantity = Number(item.quantity) || 0;
      const total = Number(item.price) * quantity;

      if (existing) {
        existing.quantity += quantity;
        existing.total += total;
      } else {
        itemMap.set(key, { name: item.name, quantity, total });
      }
    });
  });

  return Array.from(itemMap.values());
}

function buildGroups(orders: Order[]): OrderGroup[] {
  const groups = new Map<string, OrderGroup>();

  orders.forEach((order) => {
    const tableNumber = order.table_number;
    const isTable = tableNumber !== null && tableNumber !== undefined;
    const kind = isTable
      ? "table"
      : order.order_type?.toLowerCase().includes("dine")
        ? "dine-in"
        : "takeaway";
    const key = isTable ? `table-${tableNumber}` : `order-${order.id}`;
    const label = isTable
      ? `Table ${tableNumber}`
      : kind === "dine-in"
        ? "Dine-In"
        : "Takeaway";

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label,
        kind,
        orders: [],
        total: 0,
      });
    }

    const group = groups.get(key)!;
    group.orders.push(order);
    group.total += Number(order.total_amount) || 0;
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.kind === "table" && b.kind === "table") {
      return Number(a.label.replace("Table ", "")) - Number(b.label.replace("Table ", ""));
    }

    if (a.kind === "table") return -1;
    if (b.kind === "table") return 1;

    return new Date(b.orders[0].created_at).getTime() - new Date(a.orders[0].created_at).getTime();
  });
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingGroup, setUpdatingGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("live-orders-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .neq("status", "completed")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error.message);
      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  const groups = useMemo(() => buildGroups(orders), [orders]);
  const activeTotal = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const tableGroupCount = groups.filter((group) => group.kind === "table").length;
  const takeawayCount = groups.filter((group) => group.kind === "takeaway").length;

  async function updateGroupStatus(group: OrderGroup, status: string) {
    setUpdatingGroup(group.key);
    const ids = group.orders.map((order) => order.id);

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .in("id", ids);

    if (error) {
      alert(`Could not update orders: ${error.message}`);
    } else {
      setOrders((current) =>
        status === "completed"
          ? current.filter((order) => !ids.includes(order.id))
          : current.map((order) => (ids.includes(order.id) ? { ...order, status } : order)),
      );
    }

    setUpdatingGroup(null);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#D64000]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-orange-50/30 p-4 md:p-8 text-gray-900 animate-fade-in">
      <div className="fixed inset-0 bg-[url('/logo.jpg')] bg-cover bg-center opacity-[0.02] pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-black text-[#D64000] uppercase tracking-widest mb-2">
              Admin Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter">
              Live Orders
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 glass-card text-gray-500 px-5 py-3 rounded-2xl font-black text-xs uppercase hover:text-gray-900 transition"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-[2rem] p-5 hover-lift">
            <ReceiptText className="text-[#D64000] mb-4" size={24} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Orders</p>
            <p className="text-3xl font-black mt-1">{orders.length}</p>
          </div>
          <div className="glass-card rounded-[2rem] p-5 hover-lift">
            <Table2 className="text-gray-900 mb-4" size={24} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Table Groups</p>
            <p className="text-3xl font-black mt-1">{tableGroupCount}</p>
          </div>
          <div className="glass-card rounded-[2rem] p-5 hover-lift">
            <ShoppingBag className="text-blue-600 mb-4" size={24} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Takeaway</p>
            <p className="text-3xl font-black mt-1">{takeawayCount}</p>
          </div>
          <div className="glass-card rounded-[2rem] p-5 hover-lift">
            <CheckCircle2 className="text-green-600 mb-4" size={24} />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Open Value</p>
            <p className="text-3xl font-black mt-1">Nu. {activeTotal.toFixed(0)}</p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-12 text-center">
            <Clock className="mx-auto text-gray-200 mb-4" size={56} />
            <p className="text-xl font-black text-gray-400">No live orders yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {groups.map((group) => {
              const combinedItems = combineItems(group.orders);
              const groupStatus = group.orders.some((order) => order.status === "pending")
                ? "pending"
                : group.orders.some((order) => order.status === "confirmed")
                  ? "confirmed"
                  : "cooking";

              return (
                <article
                  key={group.key}
                  className="glass-card rounded-[2rem] overflow-hidden hover-lift"
                >
                  <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        group.kind === "table"
                          ? "bg-gray-900 text-white"
                          : group.kind === "dine-in"
                            ? "bg-[#FFF0E8] text-[#D64000]"
                            : "bg-blue-50 text-blue-600"
                      }`}>
                        {group.kind === "table" && <Table2 size={22} />}
                        {group.kind === "dine-in" && <UtensilsCrossed size={22} />}
                        {group.kind === "takeaway" && <ShoppingBag size={22} />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black italic tracking-tighter">{group.label}</h2>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          {group.orders.length} guest order{group.orders.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[groupStatus]}`}>
                      {formatStatus(groupStatus)}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      {combinedItems.map((item) => (
                        <div key={`${group.key}-${item.name}`} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                          <p className="font-black text-sm text-gray-800">{item.quantity}x {item.name}</p>
                          <p className="text-xs font-bold text-[#D64000] mt-1">Nu. {item.total.toFixed(0)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {group.orders.map((order) => (
                        <div key={order.id} className="rounded-2xl bg-white/50 backdrop-blur-sm p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2 font-black text-gray-900">
                                <User size={15} className="text-gray-300" />
                                {order.customer_name || "Guest"}
                              </div>
                              {order.customer_phone && (
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                                  <Phone size={13} />
                                  {order.customer_phone}
                                </div>
                              )}
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-xs font-bold text-gray-400">
                                {new Date(order.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="font-black text-[#D64000]">Nu. {Number(order.total_amount || 0).toFixed(0)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {order.items?.map((item, index) => (
                              <span key={`${order.id}-${item.name}-${index}`} className="bg-gray-100 rounded-full px-3 py-1 text-[10px] font-bold text-gray-500">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="mr-auto">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Group Total</p>
                        <p className="text-2xl font-black">Nu. {group.total.toFixed(0)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateGroupStatus(group, "confirmed")}
                        disabled={updatingGroup === group.key}
                        className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 font-black text-xs uppercase disabled:opacity-50 hover:bg-blue-100 hover:scale-105 hover:shadow-lg transition-all active:scale-95"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGroupStatus(group, "cooking")}
                        disabled={updatingGroup === group.key}
                        className="px-4 py-3 rounded-2xl bg-orange-50 text-orange-700 font-black text-xs uppercase disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-orange-100 hover:scale-105 hover:shadow-lg transition-all active:scale-95"
                      >
                        <ChefHat size={15} /> Cooking
                      </button>
                      <button
                        type="button"
                        onClick={() => updateGroupStatus(group, "completed")}
                        disabled={updatingGroup === group.key}
                        className="px-4 py-3 rounded-2xl bg-green-600 text-white font-black text-xs uppercase disabled:opacity-50 hover:bg-green-500 hover:scale-105 hover:shadow-lg transition-all active:scale-95"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
