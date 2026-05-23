import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { hasAdminAccess } from "./lib/admin";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import Home from "./pages/Home";
import CustomerMenu from "./pages/Inventory";
import StaffLogin from "./pages/StaffLogin";
import AdminDashboard from "./pages/Admindashboard";
import OrdersHistory from "./pages/OrdersHistory";
import Analytics from "./pages/Analytics";
import QRGenerator from "./pages/QRGenerator";
import MenuManager from "./pages/MenuManager";

const ADMIN_PATHS = [
  "/live-orders",
  "/menu-items",
  "/order-history",
  "/analytics",
  "/qr-generator",
];

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D64000] to-[#FFB800] flex items-center justify-center animate-pulse">
          <span className="text-white font-black text-xl font-[Playfair_Display] italic">O</span>
        </div>
        <div className="w-6 h-6 border-2 border-[#D64000] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  const isAdminPath = ADMIN_PATHS.some((p) => location.pathname.startsWith(p));
  const isAdmin = hasAdminAccess(session?.user);
  const showSidebar = session && isAdmin && isAdminPath;

  const requireAdmin = (page: ReactElement) => {
    return session && isAdmin ? page : <Navigate to="/" replace />;
  };

  const sidebarWidth = sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-64";

  return (
    <ToastProvider>
      <div className={`flex min-h-screen ${showSidebar ? "bg-white" : "bg-[#0f0f0f]"}`}>
        {showSidebar && <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)} />}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${showSidebar ? sidebarWidth : ""}`}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<CustomerMenu />} />
            <Route
              path="/admin-login"
              element={
                session && isAdmin ? <Navigate to="/live-orders" replace /> : <StaffLogin />
              }
            />

            {/* Admin-protected */}
            <Route
              path="/live-orders"
              element={requireAdmin(<AdminDashboard />)}
            />
            <Route
              path="/order-history"
              element={requireAdmin(<OrdersHistory />)}
            />
            <Route
              path="/analytics"
              element={requireAdmin(<Analytics />)}
            />
            <Route
              path="/menu-items"
              element={requireAdmin(<MenuManager />)}
            />
            <Route
              path="/qr-generator"
              element={requireAdmin(<QRGenerator />)}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
