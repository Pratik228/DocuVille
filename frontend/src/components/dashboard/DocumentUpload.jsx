import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  uploadDocument,
  getDocuments,
} from "../../features/documents/documentSlice";
import { FiUpload, FiFile, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

const DocumentUpload = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.documents);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("File size should be less than 5MB");
        return;
      }

      setFile(selectedFile);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // components/dashboard/DocumentUpload.jsx
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", "aadharId");

    try {
      // const result = await dispatch(uploadDocument(formData)).unwrap();
      await dispatch(uploadDocument(formData)).unwrap();
      toast.success("Document uploaded successfully");
      setFile(null);
      setPreview(null);
      // Refresh the list after successful upload
      dispatch(getDocuments());
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err || "Upload failed");
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div>
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="flex justify-center items-center w-full">
          <label className="flex flex-col justify-center items-center w-full h-64 bg-base-200 rounded-lg border-2 border-base-300 border-dashed cursor-pointer hover:bg-base-300 transition-all relative">
            {preview ? (
              <div className="relative w-full h-full">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain p-4"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="btn btn-circle btn-sm absolute top-2 right-2"
                >
                  <FiX />
                </button>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center pt-5 pb-6">
                <FiUpload className="w-10 h-10 text-base-content/50 mb-3" />
                <p className="mb-2 text-sm text-base-content/70">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-base-content/50">
                  Supported formats: JPEG, PNG, PDF (MAX. 5MB)
                </p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,application/pdf"
            />
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-between bg-base-200 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <FiFile className="w-5 h-5" />
              <span className="text-sm truncate max-w-[200px]">
                {file.name}
              </span>
            </div>
            <span className="text-xs text-base-content/50">
              {(file.size / (1024 * 1024)).toFixed(2)}MB
            </span>
          </div>
        )}

        <button
          type="submit"
          className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
          disabled={!file || isLoading}
        >
          {isLoading ? "Uploading..." : "Upload Document"}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload;
