import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDocuments } from "../../features/documents/documentSlice";
import { FiFileText, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { format } from "date-fns";
import AdminVerifyModal from "./AdminVerifyModal";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { documents = [], isLoading } = useSelector((state) => state.documents);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    dispatch(getDocuments());
  }, [dispatch]);

  // Group documents by status - with null checks
  const pendingDocuments = Array.isArray(documents)
    ? documents.filter((doc) => doc?.verificationStatus === "pending")
    : [];

  const verifiedDocuments = Array.isArray(documents)
    ? documents.filter((doc) => doc?.verificationStatus === "verified")
    : [];

  const rejectedDocuments = Array.isArray(documents)
    ? documents.filter((doc) => doc?.verificationStatus === "rejected")
    : [];

  const stats = {
    total: documents?.length || 0,
    pending: pendingDocuments.length,
    verified: verifiedDocuments.length,
    rejected: rejectedDocuments.length,
  };

  const AdminDocumentCard = ({ document, showVerifyActions }) => {
    if (!document) return null;

    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-semibold">{document.name || "No Name"}</h3>
              <p className="text-sm text-base-content/70">
                ID: XXXX-{document.documentNumber?.slice(-4) || "####"}
              </p>
              <p className="text-xs">
                Uploaded: {format(new Date(document.createdAt), "dd MMM yyyy")}
              </p>
              {document.adminNotes && (
                <p className="text-xs text-base-content/70">
                  Notes: {document.adminNotes}
                </p>
              )}
            </div>
            <div
              className={`badge ${
                document.verificationStatus === "verified"
                  ? "badge-success"
                  : document.verificationStatus === "rejected"
                  ? "badge-error"
                  : "badge-warning"
              }`}
            >
              {document.verificationStatus || "pending"}
            </div>
          </div>

          {showVerifyActions && (
            <button
              onClick={() => setSelectedDocument(document)}
              className="btn btn-primary btn-sm mt-4"
            >
              Verify Document
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard 🔐</h1>
          <p className="text-base-content/70">
            Manage and verify user documents
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-primary">
                <FiFileText className="w-6 h-6" />
              </div>
              <div className="stat-title">Total Documents</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-warning">
                <FiClock className="w-6 h-6" />
              </div>
              <div className="stat-title">Pending</div>
              <div className="stat-value">{stats.pending}</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-success">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <div className="stat-title">Verified</div>
              <div className="stat-value">{stats.verified}</div>
            </div>
          </div>

          <div className="stats shadow">
            <div className="stat">
              <div className="stat-figure text-error">
                <FiXCircle className="w-6 h-6" />
              </div>
              <div className="stat-title">Rejected</div>
              <div className="stat-value">{stats.rejected}</div>
            </div>
          </div>
        </div>

        {/* Pending Documents */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiClock className="text-warning" />
            Pending Verification ({stats.pending})
          </h2>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : pendingDocuments.length === 0 ? (
            <div className="text-center py-8 bg-base-100 rounded-lg">
              <FiFileText className="w-12 h-12 mx-auto text-base-content/30" />
              <h3 className="mt-4 text-lg font-semibold">
                No Pending Documents
              </h3>
              <p className="text-base-content/70">
                All documents have been processed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingDocuments.map((doc) => (
                <AdminDocumentCard
                  key={doc._id}
                  document={doc}
                  showVerifyActions={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Verified Documents */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiCheckCircle className="text-success" />
            Verified Documents ({stats.verified})
          </h2>
          {verifiedDocuments.length === 0 ? (
            <div className="text-center py-8 bg-base-100 rounded-lg">
              <p className="text-base-content/70">No verified documents yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verifiedDocuments.map((doc) => (
                <AdminDocumentCard
                  key={doc._id}
                  document={doc}
                  showVerifyActions={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Rejected Documents */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiXCircle className="text-error" />
            Rejected Documents ({stats.rejected})
          </h2>
          {rejectedDocuments.length === 0 ? (
            <div className="text-center py-8 bg-base-100 rounded-lg">
              <p className="text-base-content/70">No rejected documents</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedDocuments.map((doc) => (
                <AdminDocumentCard
                  key={doc._id}
                  document={doc}
                  showVerifyActions={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {selectedDocument && (
          <AdminVerifyModal
            document={selectedDocument}
            onClose={() => {
              setSelectedDocument(null);
              dispatch(getDocuments()); // Refresh the list after verification
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
