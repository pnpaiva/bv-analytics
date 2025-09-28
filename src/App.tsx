import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrganizationProvider } from "@/hooks/useOrganizationContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, AdminProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Campaigns from "./pages/Campaigns";
import Analytics from "./pages/Analytics";
import MasterCampaigns from "./pages/MasterCampaigns";
import CreatorProfiles from "./pages/CreatorProfiles";
import ProjectManagement from "./pages/ProjectManagement";
import RoleBasedDashboard from "./pages/RoleBasedDashboard";
import AdminBlog from "./pages/AdminBlog";
import Profile from "./pages/Profile";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PublicMediaKit from "./pages/PublicMediaKit";
import OrganizationManagement from "./pages/OrganizationManagement";
import OrganizationUsers from "./pages/OrganizationUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <OrganizationProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Public routes - accessible without authentication */}
          <Route path="/" element={<Index />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          
          {/* Public media kit routes - accessible to anyone with the link */}
          <Route path="/:slug" element={<PublicMediaKit />} />
          
          {/* Routes that need authentication context */}
          <Route path="/auth" element={
            <AuthProvider>
              <Auth />
            </AuthProvider>
          } />
          
          {/* Protected routes - require authentication */}
          <Route path="/campaigns" element={
            <AuthProvider>
              <ProtectedRoute>
                <Campaigns />
              </ProtectedRoute>
            </AuthProvider>
          } />
          <Route path="/analytics" element={
            <AuthProvider>
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            </AuthProvider>
          } />
          <Route path="/master-campaigns" element={
            <AuthProvider>
              <ProtectedRoute>
                <MasterCampaigns />
              </ProtectedRoute>
            </AuthProvider>
          } />
          <Route path="/creator-profiles" element={
            <AuthProvider>
              <ProtectedRoute>
                <CreatorProfiles />
              </ProtectedRoute>
            </AuthProvider>
          } />
          <Route path="/project-management" element={
            <AuthProvider>
              <ProtectedRoute>
                <ProjectManagement />
              </ProtectedRoute>
            </AuthProvider>
          } />
          <Route 
            path="/admin" 
            element={
              <AuthProvider>
                <AdminProtectedRoute>
                  <RoleBasedDashboard />
                </AdminProtectedRoute>
              </AuthProvider>
            }
          />
          <Route 
            path="/admin/blog" 
            element={
              <AuthProvider>
                <AdminProtectedRoute>
                  <AdminBlog />
                </AdminProtectedRoute>
              </AuthProvider>
            } 
          />
          <Route 
            path="/organizations" 
            element={
              <AuthProvider>
                <AdminProtectedRoute>
                  <OrganizationManagement />
                </AdminProtectedRoute>
              </AuthProvider>
            } 
          />
          <Route 
            path="/organization-users" 
            element={
              <AuthProvider>
                <AdminProtectedRoute>
                  <OrganizationUsers />
                </AdminProtectedRoute>
              </AuthProvider>
            } 
          />
          <Route path="/profile" element={
            <AuthProvider>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </AuthProvider>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
