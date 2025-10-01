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
import YouTubeCallback from "./pages/YouTubeCallback";
import OrganizationManagement from "./pages/OrganizationManagement";
import OrganizationUsers from "./pages/OrganizationUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes - accessible without authentication (no theme provider) */}
            <Route path="/" element={<Index />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            
            {/* Public media kit routes - accessible to anyone with the link */}
            <Route path="/:slug" element={<PublicMediaKit />} />
            
            {/* YouTube OAuth callback - no auth required */}
            <Route path="/youtube-callback" element={<YouTubeCallback />} />
            
            {/* Routes that need authentication context with theme support */}
            <Route path="/auth" element={
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <AuthProvider>
                  <Auth />
                </AuthProvider>
              </ThemeProvider>
            } />
            
            {/* Protected routes - require authentication with theme support */}
            <Route path="/campaigns" element={
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <AuthProvider>
                  <ProtectedRoute>
                    <Campaigns />
                  </ProtectedRoute>
                </AuthProvider>
              </ThemeProvider>
            } />
            <Route path="/analytics" element={
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <AuthProvider>
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                </AuthProvider>
              </ThemeProvider>
            } />
            <Route path="/master-campaigns" element={
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <AuthProvider>
                  <ProtectedRoute>
                    <MasterCampaigns />
                  </ProtectedRoute>
                </AuthProvider>
              </ThemeProvider>
            } />
            <Route path="/creator-profiles" element={
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <AuthProvider>
                  <ProtectedRoute>
                    <CreatorProfiles />
                  </ProtectedRoute>
                </AuthProvider>
              </ThemeProvider>
            } />
            <Route path="/project-management" element={
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <AuthProvider>
                  <ProtectedRoute>
                    <ProjectManagement />
                  </ProtectedRoute>
                </AuthProvider>
              </ThemeProvider>
            } />
            <Route 
              path="/admin" 
              element={
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                  <AuthProvider>
                    <AdminProtectedRoute>
                      <RoleBasedDashboard />
                    </AdminProtectedRoute>
                  </AuthProvider>
                </ThemeProvider>
              }
            />
            <Route 
              path="/admin/blog" 
              element={
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                  <AuthProvider>
                    <AdminProtectedRoute>
                      <AdminBlog />
                    </AdminProtectedRoute>
                  </AuthProvider>
                </ThemeProvider>
              } 
            />
            <Route 
              path="/organizations" 
              element={
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                  <AuthProvider>
                    <AdminProtectedRoute>
                      <OrganizationManagement />
                    </AdminProtectedRoute>
                  </AuthProvider>
                </ThemeProvider>
              } 
            />
            <Route 
              path="/organization-users" 
              element={
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                  <AuthProvider>
                    <AdminProtectedRoute>
                      <OrganizationUsers />
                    </AdminProtectedRoute>
                  </AuthProvider>
                </ThemeProvider>
              } 
            />
            <Route path="/profile" element={
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <AuthProvider>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </AuthProvider>
              </ThemeProvider>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
