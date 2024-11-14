import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../features/auth/authSlice";
import { toast } from "react-toastify";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(login(formData)).unwrap();
      toast.success("Login successful!");
      navigate(result.user?.isAdmin ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error || "Login failed");
    }
  };

  const loginAsUser = () => {
    setFormData({
      email: "pratik@gmail.com",
      password: "Pratik12345@",
    });
  };

  const loginAsAdmin = () => {
    setFormData({
      email: "admin@gmail.com",
      password: "Admin12345@",
    });
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl mb-4">Login</h2>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={loginAsUser}
              className="btn btn-outline btn-info btn-sm flex-1"
            >
              User Credentials
            </button>
            <button
              type="button"
              onClick={loginAsAdmin}
              className="btn btn-outline btn-warning btn-sm flex-1"
            >
              Admin Credentials
            </button>
          </div>

          <div className="divider text-xs text-base-content/50">OR</div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className="input input-bordered"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center mt-4">
              <Link to="/register" className="link link-primary">
                Dont have an account? Register
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
