import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/context/WalletContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { HelmetProvider } from 'react-helmet-async';
import { DEMO_VERIFY_URL } from '@/lib/demo';
import { lazy, Suspense } from 'react';

const Index             = lazy(() => import('./pages/Index'));
const Login             = lazy(() => import('./pages/Login'));
const AuthLanding       = lazy(() => import('./pages/AuthLanding'));
const Profile           = lazy(() => import('./pages/Profile'));
const SessionSettings   = lazy(() => import('./pages/SessionSettings'));
const BatchRegistration = lazy(() => import('./pages/BatchRegistration'));
const BatchTokenize     = lazy(() => import('./pages/BatchTokenize'));
const BatchVerify       = lazy(() => import('./pages/BatchVerify'));
const TestHedera        = lazy(() => import('./pages/TestHedera'));
const Dashboard         = lazy(() => import('./pages/Dashboard'));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
    </div>
  );
}

const App = () => (
  <HelmetProvider>
    <ThemeProvider defaultTheme="system" storageKey="agrodex-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <WalletProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/welcome" element={<AuthLanding />} />
                    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/session-settings" element={<ProtectedRoute><SessionSettings /></ProtectedRoute>} />
                    <Route path="/register" element={<ProtectedRoute><BatchRegistration /></ProtectedRoute>} />
                    <Route path="/tokenize" element={<ProtectedRoute><BatchTokenize /></ProtectedRoute>} />
                    <Route path="/verify" element={<BatchVerify />} />
                    <Route path="/verify/:tokenId/:serialNumber" element={<BatchVerify />} />
                    <Route path="/demo" element={<Navigate to={DEMO_VERIFY_URL} replace />} />
                    <Route path="/test-hedera" element={<ProtectedRoute><TestHedera /></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </WalletProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </HelmetProvider>
);

export default App;
