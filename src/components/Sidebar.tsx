import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  LayoutGrid, BarChart3, Utensils, QrCode, LogOut, Loader2, Clock,
  Menu, X, ChevronLeft,
} from "lucide-react";

const menuItems = [
  { name: "Live Orders", path: "/live-orders", icon: LayoutGrid },
  { name: "Order History", path: "/order-history", icon: Clock },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Menu Items", path: "/menu-items", icon: Utensils },
  { name: "QR Generator", path: "/qr-generator", icon: QrCode },
];

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const Sidebar = ({ collapsed, onToggleCollapse }: Props) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!session) return null;

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0">
          <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div className="group/brand cursor-default">
            <div className="font-black italic tracking-tighter uppercase leading-none transition-all duration-300 group-hover/brand:scale-105">
              <div className="text-[#D64000] text-xl transition-all duration-300 group-hover/brand:drop-shadow-[0_0_8px_rgba(214,64,0,0.4)]">ཨོ་ལོ</div>
              <div className="text-[#FFB800] text-xl -mt-0.5 transition-all duration-300 group-hover/brand:drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]">PIZZA</div>
            </div>
            <p className="text-[8px] text-gray-400 font-bold tracking-widest mt-1">ADMIN PORTAL</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all duration-200 group ${
                isActive
                  ? "bg-[#FFF0E8] text-[#D64000]"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              } ${collapsed ? "justify-center px-0 mx-1" : ""}`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#D64000]" />
              )}
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="text-sm">{item.name}</span>}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-xl">
                  {item.name}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#FFF0E8] flex items-center justify-center text-[#D64000] font-bold text-xs shrink-0">
              {session.user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-gray-900 truncate">{session.user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loading}
          className={`relative flex items-center gap-4 px-4 py-3 text-gray-400 font-bold hover:text-red-500 transition-colors w-full rounded-xl hover:bg-red-50 active:scale-95 disabled:opacity-50 group ${
            collapsed ? "justify-center px-0 mx-1" : ""
          }`}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin mx-auto" />
          ) : (
            <>
              <LogOut size={20} className="shrink-0" />
              {!collapsed && <span className="text-sm">Logout</span>}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-xl">
                  Logout
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/80 backdrop-blur-md p-3 rounded-xl shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-xl z-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <aside
        className={`hidden lg:flex bg-white/80 backdrop-blur-xl h-screen fixed left-0 top-0 border-r border-gray-200 flex-col z-50 transition-all duration-300 ease-out ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-8 w-6 h-6 bg-white rounded-full border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors z-10"
        >
          <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
