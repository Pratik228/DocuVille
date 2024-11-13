import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const userData = response.data.user;
    // Store user in localStorage
    localStorage.setItem("user", JSON.stringify(userData));
    // If token is in response, set it in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      // Set token in default headers for future requests
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${response.data.token}`;
    }
    return userData;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Add a method to check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem("user");
  },

  // Get current user data
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem("user"));
  },
};

// Update interceptors to add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default authService;
