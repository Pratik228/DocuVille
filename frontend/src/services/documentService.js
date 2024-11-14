import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api/docs`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const documentService = {
  uploadDocument: (formData, onProgress) => {
    // Get fresh token
    const token = localStorage.getItem("token");
    return api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        : undefined,
    });
  },

  getDocuments: async () => {
    const response = await api.get("/");
    return Array.isArray(response.data) ? response.data : response;
  },

  requestDocumentView: (documentId) => {
    if (!documentId) throw new Error("Document ID is required");
    return api.post(`/${documentId}/view`);
  },

  getDocumentWithToken: (viewToken) => {
    if (!viewToken) throw new Error("View token is required");
    return api.get("/view", {
      params: { viewToken },
    });
  },

  verifyDocument: async (documentId, { status, notes }) => {
    if (!documentId) throw new Error("Document ID is required");
    if (!status) throw new Error("Status is required");

    const token = localStorage.getItem("token");
    const response = await api.patch(
      `/${documentId}/verify`,
      { status, notes },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response;
  },

  deleteDocument: async (documentId) => {
    if (!documentId) throw new Error("Document ID is required");
    const token = localStorage.getItem("token");

    console.log("Initiating delete request for document:", documentId);

    try {
      const response = await api.delete(`/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        validateStatus: function (status) {
          return status < 500; // Resolve only if the status code is less than 500
        },
      });

      console.log("Delete response:", response);

      if (response.status === 404) {
        throw new Error("Document not found or unauthorized");
      }

      return response;
    } catch (error) {
      console.error("Delete request error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Provide more specific error messages
      if (error.response?.status === 404) {
        throw new Error(
          "Document not found or you don't have permission to delete it"
        );
      } else if (error.response?.status === 401) {
        throw new Error("Authentication failed - please log in again");
      } else if (!error.response) {
        throw new Error("Network error - please check your connection");
      }

      throw (
        error.response?.data?.error ||
        error.message ||
        "Failed to delete document"
      );
    }
  },
};

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
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage and redirect if unauthorized
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw error.response?.data?.error || error.message || "An error occurred";
  }
);

export default documentService;
