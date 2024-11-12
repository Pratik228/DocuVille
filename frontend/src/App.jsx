import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./components/layout/Navbar";
import PrivateRoute from "./components/layout/PrivateRoute";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import Dashboard from "./components/dashboard/Dashboard";
import AdminDashboard from "./components/dashboard/AdminDashboard";

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <LoginForm />
            ) : user.isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !user ? <RegisterForm /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route element={<PrivateRoute />}>
          <Route
            path="/dashboard"
            element={
              user?.isAdmin ? <Navigate to="/admin" replace /> : <Dashboard />
            }
          />
          <Route
            path="/admin"
            element={
              user?.isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        </Route>
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
