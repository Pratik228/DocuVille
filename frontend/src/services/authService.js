import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true, // This is crucial for cookie handling
});

const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data.user; // Backend sends user data without token
  },

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("user");
  },

  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },
};

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export default authService;
