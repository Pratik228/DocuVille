/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { FiClock, FiEye, FiEyeOff } from "react-icons/fi";
import { format } from "date-fns";
import documentService from "../../services/documentService";
import { toast } from "react-toastify";

const DocumentView = ({ document, viewToken, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isBlurred, setIsBlurred] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [documentData, setDocumentData] = useState(document);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Fetch unmasked data with viewToken
  useEffect(() => {
    const fetchUnmaskedData = async () => {
      try {
        if (!viewToken) {
          console.log("No view token provided");
          return;
        }
        const response = await documentService.getDocumentWithToken(viewToken);
        if (response.data) {
          setDocumentData(response.data);
        }
      } catch (error) {
        console.error("Error fetching unmasked data:", error);
        toast.error("Failed to load document details");
        handleClose();
      }
    };

    fetchUnmaskedData();
  }, [viewToken, handleClose]);

  const formatDocumentNumber = (number) => {
    if (!number) return "N/A";
    return number
      .replace(/[^0-9]/g, "")
      .match(/.{1,4}/g)
      ?.join(" ");
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      if (/^\d{4}$/.test(dateString)) return dateString;
      if (dateString.includes("/")) {
        const [day, month, year] = dateString.split("/");
        return format(new Date(year, month - 1, day), "dd MMM yyyy");
      }
      return format(new Date(dateString), "dd MMM yyyy");
    } catch (error) {
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

  if (!documentData) return null;

  return (
    <div className="bg-base-100 rounded-lg w-full max-w-lg">
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

      <div className="p-6">
        <div
          className={`grid grid-cols-2 gap-x-8 gap-y-4 ${
            isBlurred ? "blur-md" : ""
          }`}
        >
          <div>
            <label className="text-sm text-base-content/70">
              Document Type
            </label>
            <p className="font-semibold mt-1">Aadhar Card</p>
          </div>
          <div>
            <label className="text-sm text-base-content/70">
              Document Number
            </label>
            <p className="font-semibold mt-1">
              {formatDocumentNumber(documentData.documentNumber)}
            </p>
          </div>
          <div>
            <label className="text-sm text-base-content/70">Name</label>
            <p className="font-semibold mt-1">{documentData.name || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-base-content/70">
              Date of Birth
            </label>
            <p className="font-semibold mt-1">
              {formatDate(documentData.dateOfBirth)}
            </p>
          </div>
          <div>
            <label className="text-sm text-base-content/70">Gender</label>
            <p className="font-semibold mt-1">{documentData.gender || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-base-content/70">Status</label>
            <p className="font-semibold mt-1 capitalize">
              {documentData.verificationStatus}
            </p>
          </div>
        </div>
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
  );
};

export default DocumentView;
