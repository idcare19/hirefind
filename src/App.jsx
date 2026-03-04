import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import NavbarTop from "./components/NavbarTop";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import CandidateDashboard from "./pages/CandidateDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import JobDetail from "./pages/JobDetail";

import BecomeCompany from "./pages/BecomeCompany";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container py-5">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ role, children }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="container py-5">Loading...</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role !== role) return <Navigate to="/" replace />;
  return children;
}

function AppInner() {
  return (
    <BrowserRouter>
      <NavbarTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/job/:id" element={<JobDetail />} />

        <Route
          path="/candidate"
          element={
            <Protected>
              <RoleRoute role="candidate">
                <CandidateDashboard />
              </RoleRoute>
            </Protected>
          }
        />
        <Route
          path="/company"
          element={
            <Protected>
              <RoleRoute role="company">
                <CompanyDashboard />
              </RoleRoute>
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected>
              <RoleRoute role="admin">
                <AdminDashboard />
              </RoleRoute>
            </Protected>
          }
        />
        <Route
          path="/become-company"
          element={
            <Protected>
              <RoleRoute role="candidate">
                <BecomeCompany />
              </RoleRoute>
            </Protected>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Shows the error on screen instead of blank page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20 }}>
          <h2>App crashed 😵</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <p>Check browser Console (F12) for full stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
