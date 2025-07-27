import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import EmailVerificationPending from "./pages/EmailVerificationPending";
import OAuthCallback from "./pages/OAuthCallback";
import AGB from "./pages/AGB";
import Datenschutz from "./pages/Datenschutz";
import Datenlöschung from "./pages/Datenlöschung";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Home redirect logic */}
          <Route path="/" element={<Home />} />
          
          {/* Auth Routes (without Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/email-verification-pending" element={<EmailVerificationPending />} />
          
          {/* Legal Pages */}
          <Route path="/agb" element={<AGB />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/datenlöschung" element={<Datenlöschung />} />
          
          {/* Main App Routes (with Layout and Welcome Overlay) - Protected */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
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
                  <Route path="/oauth2callback" element={<OAuthCallback />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/plans" element={<Plans />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
