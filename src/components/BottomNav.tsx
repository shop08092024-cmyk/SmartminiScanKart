import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ScanBarcode, ShoppingCart, ClipboardList, Settings } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/scan", label: "Scan", icon: ScanBarcode },
  { path: "/cart", label: "Cart", icon: ShoppingCart },
  { path: "/orders", label: "History", icon: ClipboardList },
  { path: "/settings", label: "Settings", icon: Settings },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 ${
                isActive ? "bg-primary/10" : ""
              }`}>
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
