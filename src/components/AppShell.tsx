import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const AppShell = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
