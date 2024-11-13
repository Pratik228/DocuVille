import axios from "axios";

const api = axios.create({
  baseURL: "https://docuverify-backend.onrender.com/api", // Direct URL instead of env variable for now
  withCredentials: true,
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Debug request interceptor
api.interceptors.request.use(
  (config) => {
    console.log("Making request to:", config.url);
    const user = localStorage.getItem("user");
    if (user) {
      config.headers.Authorization = `Bearer ${JSON.parse(user).token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Debug response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("Response received:", response.status);
    return response;
  },
  (error) => {
    console.error("Response error:", {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
