/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { FiClock, FiEye, FiEyeOff } from "react-icons/fi";
import { format } from "date-fns";

const DocumentView = ({ document, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Format date function
  const formatDate = (dateString) => {
    try {
      // Handle different date formats
      if (!dateString) return "N/A";

      // If it's just a year
      if (/^\d{4}$/.test(dateString)) {
        return dateString;
      }

      // If it's already in a readable format
      if (dateString.includes("GMT") || dateString.includes("UTC")) {
        return format(new Date(dateString), "dd MMM yyyy");
      }

      if (dateString.includes("/")) {
        const [month, day, year] = dateString.split("/");
        return format(new Date(year, month - 1, day), "dd MMM yyyy");
      }

      // Handle YYYY-MM-DD format
      if (dateString.includes("-")) {
        const [year, month, day] = dateString.split("-");
        return format(new Date(year, month - 1, day), "dd MMM yyyy");
      }

      return dateString;
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        if (prev === 6) {
          setShowWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleClose]);

  useEffect(() => {
    if (showWarning) {
      const warningTimer = setTimeout(() => {
        setShowWarning(false);
      }, 2000);
      return () => clearTimeout(warningTimer);
    }
  }, [showWarning]);

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg w-full max-w-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Document Details</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiClock className={timeLeft <= 5 ? "text-error" : ""} />
              <span className={timeLeft <= 5 ? "text-error" : ""}>
                {timeLeft}s
              </span>
            </div>
            <button
              onClick={() => setIsBlurred(!isBlurred)}
              className="btn btn-ghost btn-sm"
            >
              {isBlurred ? <FiEye /> : <FiEyeOff />}
            </button>
            <button onClick={handleClose} className="btn btn-ghost btn-sm">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div
            className={`grid grid-cols-2 gap-6 ${isBlurred ? "blur-md" : ""}`}
          >
            <div>
              <label className="text-sm text-base-content/70">
                Document Type
              </label>
              <p className="font-semibold">Aadhar Card</p>
            </div>
            <div>
              <label className="text-sm text-base-content/70">
                Document Number
              </label>
              <p className="font-semibold">{document.documentNumber}</p>
            </div>
            <div>
              <label className="text-sm text-base-content/70">Name</label>
              <p className="font-semibold">{document.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-base-content/70">
                Date of Birth
              </label>
              <p className="font-semibold">
                {formatDate(document.dateOfBirth)}
              </p>
            </div>
            <div>
              <label className="text-sm text-base-content/70">Gender</label>
              <p className="font-semibold">{document.gender || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-base-content/70">Status</label>
              <p className="font-semibold capitalize">
                {document.verificationStatus}
              </p>
            </div>
          </div>
          {document.documentImage && (
            <div
              className={`relative aspect-[3/4] bg-base-200 rounded-lg overflow-hidden ${
                isBlurred ? "blur-md" : ""
              }`}
            >
              <img
                src={document.documentImage}
                alt="Document"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          {document.extractedData &&
            Object.keys(document.extractedData).length > 0 && (
              <div className={isBlurred ? "blur-md" : ""}>
                <label className="text-sm text-base-content/70 block mb-2">
                  Extracted Information
                </label>
                <pre className="bg-base-200 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(document.extractedData, null, 2)}
                </pre>
              </div>
            )}
        </div>
        {showWarning && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="alert alert-warning shadow-lg">
              <FiClock />
              <span>Document will be hidden in 5 seconds</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentView;
