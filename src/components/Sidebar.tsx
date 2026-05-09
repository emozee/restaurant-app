import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  LayoutGrid, BarChart3, Utensils, QrCode, LogOut, Loader2, Clock,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate("/", { replace: true });
  };

  if (!session) return null;

  const menuItems = [
    { name: "Live Orders", path: "/live-orders", icon: LayoutGrid },
    { name: "Order History", path: "/order-history", icon: Clock },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Menu Items", path: "/menu-items", icon: Utensils },
    { name: "QR Generator", path: "/qr-generator", icon: QrCode },
  ];

  return (
    <aside className="w-72 bg-white h-screen fixed left-0 top-0 border-r border-gray-100 flex flex-col z-50">
      <div className="p-8">
        <h1 className="text-[#FF5C00] text-2xl font-black italic tracking-tighter uppercase">GMC Restro</h1>
        <p className="text-[10px] text-gray-300 font-bold tracking-widest mt-1">ADMIN PORTAL</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all duration-200 ${
                isActive ? "bg-[#FFF5F0] text-[#FF5C00] shadow-sm" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-8 border-t border-gray-50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FF5C00] font-bold text-xs">
            {session.user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-900 truncate">{session.user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-4 px-6 py-4 text-gray-400 font-bold hover:text-red-500 transition-colors w-full rounded-2xl hover:bg-red-50 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : <><LogOut size={20} /><span className="text-sm">Logout</span></>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
