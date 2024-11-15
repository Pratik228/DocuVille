/* eslint-disable react/prop-types */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  requestDocumentView,
  deleteDocument,
  verifyDocument,
  getDocuments,
} from "../../features/documents/documentSlice";
import { FiEye, FiTrash2, FiCheckCircle } from "react-icons/fi";
import { format } from "date-fns";
import { toast } from "react-toastify";
import DocumentView from "./DocumentView";

const AdminVerifyModal = ({ document, onClose }) => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState("verified");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      await dispatch(verifyDocument({ id: document._id, status })).unwrap();
      await dispatch(getDocuments());
      toast.success(`Document marked as ${status}`);
      onClose();
    } catch (err) {
      toast.error(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-lg shadow-xl w-96">
        <h3 className="text-lg font-bold mb-4">Verify Document</h3>
        <div className="form-control">
          <select
            className="select select-bordered w-full"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="verified">Verify</option>
            <option value="rejected">Reject</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button
            className={`btn btn-primary ${isVerifying ? "loading" : ""}`}
            onClick={handleVerify}
            disabled={isVerifying}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const DocumentCard = ({ document }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showDetails, setShowDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewToken, setViewToken] = useState(null);
  const [showAdminVerify, setShowAdminVerify] = useState(false);
  const maskedNumber =
    viewToken && document?.documentNumber
      ? document.documentNumber
      : `XXXX-${document.documentNumber.slice(-4)}`;

  const handleViewRequest = async () => {
    try {
      if (!document || !document._id) {
        throw new Error("Invalid document ID");
      }

      const response = await dispatch(
        requestDocumentView(document._id)
      ).unwrap();

      if (response.viewToken) {
        setViewToken(response.viewToken);
        setShowViewer(true);
        toast.success(
          `Document can be viewed for 30 seconds. ${response.viewsRemaining} views remaining`
        );
      } else {
        throw new Error("No view token received");
      }
    } catch (err) {
      console.error("View request error:", err);
      toast.error(err.message || "Failed to request document view");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        setIsDeleting(true);
        await dispatch(deleteDocument(document._id)).unwrap();
        toast.success("Document deleted successfully");
        await dispatch(getDocuments());
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error(err.toString() || "Failed to delete document");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusBadge = () => {
    let badgeClass = "badge-warning";
    let badgeText = "pending";

    switch (document.verificationStatus) {
      case "verified":
        badgeClass = "badge-success";
        badgeText = "verified";
        break;
      case "rejected":
        badgeClass = "badge-error";
        badgeText = "rejected";
        break;
      default:
        break;
    }

    return (
      <div className={`badge ${badgeClass} badge-sm gap-1`}>
        {document.verificationStatus === "verified" && (
          <FiCheckCircle className="w-3 h-3" />
        )}
        {badgeText}
      </div>
    );
  };

  if (!document) return null;

  return (
    <>
      <div className="card bg-base-200 shadow-sm hover:shadow-md transition-all">
        <div className="card-body p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {document.documentType === "aadharId" && "Aadhar Card"}
                {getStatusBadge()}
              </h3>
              <p className="text-sm text-base-content/70">{maskedNumber}</p>
            </div>

            <div className="flex gap-2">
              {user?.isAdmin && document.verificationStatus === "pending" && (
                <button
                  onClick={() => setShowAdminVerify(true)}
                  className="btn btn-ghost btn-sm btn-info"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Verify
                </button>
              )}

              <button
                onClick={handleViewRequest}
                className="btn btn-ghost btn-sm"
                disabled={!document._id || document.viewCount >= 5}
              >
                <FiEye className="w-4 h-4" />
                {document.viewCount >= 5 ? "No views left" : "View"}
              </button>

              <button
                onClick={handleDelete}
                className={`btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content
                  ${isDeleting ? "loading" : ""}`}
                disabled={isDeleting}
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-base-content/50">Uploaded:</span>{" "}
                {format(new Date(document.createdAt), "MMM d, yyyy")}
              </p>
              <p>
                <span className="text-base-content/50">Views Remaining:</span>{" "}
                {5 - (document.viewCount || 0)}
              </p>
              {document.lastViewedAt && (
                <p>
                  <span className="text-base-content/50">Last Viewed:</span>{" "}
                  {format(new Date(document.lastViewedAt), "MMM d, yyyy HH:mm")}
                </p>
              )}
              {document.verifiedAt && (
                <p>
                  <span className="text-base-content/50">Verified At:</span>{" "}
                  {format(new Date(document.verifiedAt), "MMM d, yyyy HH:mm")}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-xs text-base-content/50 hover:text-base-content"
          >
            {showDetails ? "Show less" : "Show more"}
          </button>
        </div>
      </div>

      {showViewer && viewToken && document && (
        <DocumentView
          document={document}
          viewToken={viewToken}
          onClose={() => {
            setShowViewer(false);
            setViewToken(null);
          }}
        />
      )}

      {showAdminVerify && (
        <AdminVerifyModal
          document={document}
          onClose={() => setShowAdminVerify(false)}
        />
      )}
    </>
  );
};

export default DocumentCard;
