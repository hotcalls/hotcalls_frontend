import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import { WelcomeFlow } from "@/components/WelcomeFlow";

export default function Welcome() {
  const navigate = useNavigate();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6 bg-background">
          <div className="blur-sm pointer-events-none">
            <Dashboard />
          </div>
        </main>
      </div>
      <div className="fixed inset-0 z-50">
        <WelcomeFlow onComplete={() => navigate("/dashboard")} />
      </div>
    </SidebarProvider>
  );
}


