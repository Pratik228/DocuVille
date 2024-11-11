import axios from "axios";

const API_URL = "http://localhost:8000/api/docs";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const documentService = {
  uploadDocument: (formData, onProgress) => {
    return api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
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
    // If the response has a data property and it's an array, use it
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

    try {
      const response = await api.patch(`/${documentId}/verify`, {
        status,
        notes,
      });
      return response;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error("Not authorized to verify documents");
      }
      throw error;
    }
  },

  deleteDocument: (documentId) => {
    if (!documentId) throw new Error("Document ID is required");
    return api.delete(`/${documentId}`);
  },
};

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle specific error cases
    if (error.response?.status === 401) {
      throw new Error("Please log in to continue");
    }
    throw error.response?.data?.error || error.message || "An error occurred";
  }
);

export default documentService;