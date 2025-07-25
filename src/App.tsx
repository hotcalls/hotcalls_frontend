import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentConfig from "./pages/AgentConfig";
import AgentAnalytics from "./pages/AgentAnalytics";
import LeadSources from "./pages/LeadSources";
import MetaConfig from "./pages/MetaConfig";
import WebhookConfig from "./pages/WebhookConfig";
import Leads from "./pages/Leads";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/create" element={<AgentConfig />} />
            <Route path="/agents/edit/:id" element={<AgentConfig />} />
            <Route path="/agents/analytics/:id" element={<AgentAnalytics />} />
            <Route path="/lead-sources" element={<LeadSources />} />
            <Route path="/lead-sources/meta/config" element={<MetaConfig />} />
            <Route path="/lead-sources/webhook/config" element={<WebhookConfig />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
