import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import documentService from "../../services/documentService";

export const uploadDocument = createAsyncThunk(
  "documents/upload",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      return await documentService.uploadDocument(formData, (progress) => {
        dispatch(setUploadProgress(progress));
      });
    } catch (error) {
      return rejectWithValue(error.message || "Upload failed");
    }
  }
);

export const getDocuments = createAsyncThunk(
  "documents/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await documentService.getDocuments();
      // Ensure we have an array of documents
      return Array.isArray(response) ? response : response.data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return rejectWithValue(error.message || "Failed to fetch documents");
    }
  }
);

export const requestDocumentView = createAsyncThunk(
  "documents/requestView",
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await documentService.requestDocumentView(documentId);
      return {
        viewToken: response.viewToken,
        viewsRemaining: response.viewsRemaining,
        documentId,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to request view");
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documents/delete",
  async (documentId, { rejectWithValue }) => {
    try {
      await documentService.deleteDocument(documentId);
      return documentId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete document");
    }
  }
);

export const verifyDocument = createAsyncThunk(
  "documents/verify",
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const response = await documentService.verifyDocument(id, {
        status,
        notes,
      });
      return response.document;
    } catch (error) {
      return rejectWithValue(error.message || "Verification failed");
    }
  }
);

const initialState = {
  documents: [],
  activeDocument: null,
  viewToken: null,
  viewsRemaining: null,
  isLoading: false,
  uploadProgress: 0,
  error: null,
  success: false,
};

const documentSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    resetState: (state) => {
      state.error = null;
      state.success = false;
      state.uploadProgress = 0;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearActiveDocument: (state) => {
      state.activeDocument = null;
      state.viewToken = null;
    },
    updateDocumentView: (state, action) => {
      const { documentId } = action.payload;
      const document = state.documents.find((doc) => doc._id === documentId);
      if (document) {
        document.viewCount = (document.viewCount || 0) + 1;
        document.lastViewedAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Document
      .addCase(uploadDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents.unshift(action.payload);
        state.success = true;
        state.uploadProgress = 0;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.uploadProgress = 0;
      })
      // Get Documents
      .addCase(getDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = action.payload || [];
      })
      .addCase(getDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Request Document View
      .addCase(requestDocumentView.fulfilled, (state, action) => {
        state.viewToken = action.payload.viewToken;
        state.viewsRemaining = action.payload.viewsRemaining;
        const document = state.documents.find(
          (doc) => doc._id === action.payload.documentId
        );
        if (document) {
          document.viewCount = (document.viewCount || 0) + 1;
        }
      })
      // Delete Document
      .addCase(deleteDocument.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.isLoading = false;
        state.documents = state.documents.filter(
          (doc) => doc._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Verify Document
      .addCase(verifyDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(
          (doc) => doc._id === action.payload._id
        );
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
      });
  },
});

export const {
  resetState,
  setUploadProgress,
  clearActiveDocument,
  updateDocumentView,
} = documentSlice.actions;

export default documentSlice.reducer;
