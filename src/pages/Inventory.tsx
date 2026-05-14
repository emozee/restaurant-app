import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Loader2,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";

type OrderMode = "dine-in" | "takeaway";

type CustomerInfo = {
  name: string;
  phone: string;
  type: OrderMode;
  tableNumber?: number;
};

type BasketEntry = {
  item: any;
  qty: number;
};

function itemCategory(item: any) {
  return item.category || "Menu";
}

function readStoredCustomer(key: string): CustomerInfo | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CustomerMenu() {
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table");
  const tableNumber = tableParam ? Number(tableParam) : undefined;
  const isTableOrder = Boolean(tableNumber);
  const customerStorageKey = isTableOrder
    ? `customer_info_table_${tableNumber}`
    : "customer_info";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [basket, setBasket] = useState<Record<string, BasketEntry>>({});
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(() =>
    readStoredCustomer(customerStorageKey),
  );
  const [customerForm, setCustomerForm] = useState<CustomerInfo>(() => ({
    name: customerInfo?.name || "",
    phone: customerInfo?.phone || "",
    type: isTableOrder ? "dine-in" : customerInfo?.type || "takeaway",
    tableNumber,
  }));

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeOrderStorageKey = customerInfo
    ? `active_order_${isTableOrder ? `table_${tableNumber}` : customerInfo.type}_${customerInfo.phone}`
    : "active_order_guest";

  useEffect(() => {
    const storedCustomer = readStoredCustomer(customerStorageKey);
    setCustomerInfo(storedCustomer);
    setCustomerForm({
      name: storedCustomer?.name || "",
      phone: storedCustomer?.phone || "",
      type: isTableOrder ? "dine-in" : storedCustomer?.type || "takeaway",
      tableNumber,
    });
  }, [customerStorageKey, isTableOrder, tableNumber]);

  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    const fetchActiveOrderStatus = async () => {
      const savedOrderId = localStorage.getItem(activeOrderStorageKey);
      if (!savedOrderId) return;

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", savedOrderId)
        .single();

      if (data) setActiveOrder(data);
    };

    fetchActiveOrderStatus();
    const interval = window.setInterval(fetchActiveOrderStatus, 5000);
    return () => window.clearInterval(interval);
  }, [activeOrderStorageKey]);

  async function fetchMenu() {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("name");

      if (error) console.error(error.message);
      if (data) setItems(data);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(items.map(itemCategory)));
    return ["All", ...uniqueCategories];
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(query);
      const matchesCategory = activeCategory === "All" || itemCategory(item) === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, activeCategory]);

  const basketItems = Object.values(basket).filter((entry) => entry.qty > 0);
  const basketCount = basketItems.reduce((sum, entry) => sum + entry.qty, 0);
  const basketTotal = basketItems.reduce(
    (sum, entry) => sum + Number(entry.item.price) * entry.qty,
    0,
  );
  const needsCustomerDetails =
    !customerInfo?.name?.trim() || !customerInfo?.phone?.trim();

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    if (category === "All") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    sectionRefs.current[category]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const addToBasket = (item: any) => {
    setBasket((prev) => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty || 0) + 1 },
    }));
  };

  const removeFromBasket = (id: string) => {
    setBasket((prev) => {
      const qty = prev[id]?.qty || 0;
      if (qty <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }

      return { ...prev, [id]: { ...prev[id], qty: qty - 1 } };
    });
  };

  const saveCustomerDetails = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextInfo: CustomerInfo = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      type: isTableOrder ? "dine-in" : customerForm.type,
      tableNumber,
    };

    if (!nextInfo.name || !nextInfo.phone) return;

    localStorage.setItem(customerStorageKey, JSON.stringify(nextInfo));
    setCustomerInfo(nextInfo);
  };

  const editCustomerDetails = () => {
    setCustomerForm({
      name: customerInfo?.name || "",
      phone: customerInfo?.phone || "",
      type: isTableOrder ? "dine-in" : customerInfo?.type || "takeaway",
      tableNumber,
    });
    setCustomerInfo(null);
  };

  const handlePlaceOrder = async () => {
    if (basketItems.length === 0) return;
    if (!customerInfo || needsCustomerDetails) {
      setIsBasketOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = basketItems.map((entry) => ({
        id: entry.item.id,
        name: entry.item.name,
        price: Number(entry.item.price),
        quantity: entry.qty,
      }));

      const orderData: any = {
        items: orderItems,
        total_amount: basketTotal,
        status: "pending",
        order_type: customerInfo.type === "dine-in" ? "Dine-In" : "Takeaway",
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        created_at: new Date().toISOString(),
      };

      if (isTableOrder) {
        orderData.table_number = tableNumber;
        orderData.order_type = "Dine-In";
      }

      const { data, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        localStorage.setItem(activeOrderStorageKey, data.id);
        setActiveOrder(data);
      }

      setBasket({});
      setIsBasketOpen(false);
      setOrderSuccess(true);
      window.setTimeout(() => setOrderSuccess(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to place order: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#D64000]" size={40} />
      </div>
    );
  }

  if (needsCustomerDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <form
          onSubmit={saveCustomerDetails}
          className="w-full max-w-md glass-card rounded-[2rem] p-7 sm:p-8 shadow-sm"
        >
          <div className="flex items-center gap-4 mb-7">
            <div className="w-14 h-14 rounded-2xl bg-[#D64000] text-white flex items-center justify-center">
              {isTableOrder ? <UtensilsCrossed size={26} /> : <ShoppingBag size={26} />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 italic tracking-tighter">
                {isTableOrder ? `Table ${tableNumber}` : "Customer Details"}
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {isTableOrder ? "Scan and order" : "Dine-in or takeaway"}
              </p>
            </div>
          </div>

          {!isTableOrder && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setCustomerForm((form) => ({ ...form, type: "dine-in" }))}
                className={`p-4 rounded-2xl font-black text-xs uppercase transition ${
                  customerForm.type === "dine-in"
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-400"
                }`}
              >
                Dine-In
              </button>
              <button
                type="button"
                onClick={() => setCustomerForm((form) => ({ ...form, type: "takeaway" }))}
                className={`p-4 rounded-2xl font-black text-xs uppercase transition ${
                  customerForm.type === "takeaway"
                    ? "bg-[#D64000] text-white"
                    : "bg-white text-gray-400"
                }`}
              >
                Takeaway
              </button>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">Name</span>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  required
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm((form) => ({ ...form, name: e.target.value }))}
                  className="w-full bg-white/80 backdrop-blur-sm text-gray-900 pl-12 pr-4 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Enter your name"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">Phone Number</span>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  required
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm((form) => ({ ...form, phone: e.target.value }))}
                  className="w-full bg-white/80 backdrop-blur-sm text-gray-900 pl-12 pr-4 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Enter phone number"
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 w-full bg-[#D64000] text-white p-5 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition"
          >
            Continue to Menu
          </button>
        </form>
      </div>
    );
  }

  const currentCustomer = customerInfo as CustomerInfo;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {orderSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-green-600/80 backdrop-blur-xl text-white px-6 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 border border-white/10">
          <CheckCircle2 size={18} /> Order placed successfully
        </div>
      )}

      {activeOrder && activeOrder.status !== "completed" && (
        <div
          className={`px-6 py-3 sticky top-0 z-[60] shadow-lg text-white backdrop-blur-xl ${
            activeOrder.status === "cooking" ? "bg-orange-600/80" :
            activeOrder.status === "confirmed" ? "bg-blue-600/80" :
            "bg-yellow-600/80"
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            {activeOrder.status === "cooking" ? (
              <ChefHat size={18} />
            ) : (
              <Clock className="animate-pulse" size={18} />
            )}
            <p className="text-xs font-black uppercase">
              {activeOrder.status === "pending" && "Waiting for confirmation"}
              {activeOrder.status === "confirmed" && "Order received and queued"}
              {activeOrder.status === "cooking" && "Your order is being prepared"}
            </p>
          </div>
        </div>
      )}

      {isTableOrder && (
        <div className="bg-gray-900 text-white px-6 py-2 text-center">
          <p className="text-xs font-black uppercase tracking-widest">
            Table {tableNumber} - {currentCustomer.name}
          </p>
        </div>
      )}

      <div className="sticky top-0 z-50 glass-nav backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="font-black text-[#D64000] text-lg italic uppercase tracking-tighter">
              <span className="text-[#FFB800]">OLO</span> Pizza
            </h1>
            <button
              type="button"
              onClick={editCustomerDetails}
              className="text-left text-[10px] text-gray-400 font-bold truncate max-w-[190px]"
            >
              {isTableOrder
                ? `Table ${tableNumber} - ${currentCustomer.name}`
                : `${currentCustomer.type === "dine-in" ? "Dine-In" : "Takeaway"} - ${currentCustomer.name}`}
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsBasketOpen(true)}
            className="p-3 bg-gray-50 rounded-2xl relative"
            aria-label="Open cart"
          >
            <ShoppingCart size={22} />
            {basketCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D64000] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {basketCount}
              </span>
            )}
          </button>
        </div>

        <nav className="flex gap-2 px-6 pb-4 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => scrollToCategory(category)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                activeCategory === category
                  ? "bg-[#D64000] text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {category}
            </button>
          ))}
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-24">
        {(activeCategory === "All"
          ? categories.filter((c) => c !== "All")
          : [activeCategory]
        ).map((category) => {
          const categoryItems = filteredItems.filter((item) => itemCategory(item) === category);
          if (categoryItems.length === 0) return null;

          return (
            <div
              key={category}
              ref={(element) => {
                sectionRefs.current[category] = element;
              }}
              className="pt-8"
            >
              <h2 className="text-sm font-black uppercase text-gray-400 mb-5 tracking-widest">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((item) => {
                  const qty = basket[item.id]?.qty || 0;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 glass-card rounded-[2rem] hover-lift hover:shadow-md transition-shadow"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0">
                        <img
                          src={item.image_url || "https://via.placeholder.com/150"}
                          className="w-full h-full object-cover"
                          alt={item.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 text-sm truncate">{item.name}</p>
                        <p className="text-[#D64000] font-black text-sm">Nu. {item.price}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {qty > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => removeFromBasket(item.id)}
                              className="w-8 h-8 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center active:scale-90"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-black text-gray-800 w-5 text-center text-sm">{qty}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => addToBasket(item)}
                          className="w-9 h-9 bg-gray-900 text-white rounded-full flex items-center justify-center active:scale-90"
                          aria-label={`Add ${item.name}`}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="py-24 text-center text-gray-400 font-bold">
            No items found for "{search}"
          </div>
        )}
      </main>

      {isBasketOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="w-full max-w-md glass-light rounded-t-[2.5rem] p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Your Cart</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBasket({})}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-full"
                  aria-label="Clear cart"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsBasketOpen(false)}
                  className="p-2 bg-gray-100 rounded-full"
                  aria-label="Close cart"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-2xl px-4 py-3 mb-4 text-xs font-bold text-gray-500 border border-white/10">
              {isTableOrder
                ? `Table ${tableNumber} order for ${currentCustomer.name}`
                : `${currentCustomer.type === "dine-in" ? "Dine-in" : "Takeaway"} order for ${currentCustomer.name}`}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-5">
              {basketItems.map((entry) => (
                <div key={entry.item.id} className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div>
                    <p className="font-black text-gray-800 text-sm">{entry.item.name}</p>
                    <p className="text-[#D64000] text-xs font-bold">
                      Nu. {entry.item.price} x {entry.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => removeFromBasket(entry.item.id)}
                      className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-black w-5 text-center">{entry.qty}</span>
                    <button
                      type="button"
                      onClick={() => addToBasket(entry.item)}
                      className="w-7 h-7 bg-gray-900 text-white rounded-full flex items-center justify-center"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {basketItems.length === 0 && (
                <p className="text-center text-gray-400 py-10 font-bold">Your cart is empty</p>
              )}
            </div>

            {basketItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-black text-gray-400 uppercase text-xs tracking-widest">Total</span>
                  <span className="font-black text-xl text-gray-900">
                    Nu. {basketTotal.toFixed(0)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full bg-[#D64000] text-white p-5 rounded-2xl font-black uppercase shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : "Place Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
