import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDocuments } from "../../features/documents/documentSlice";
import DocumentUpload from "./DocumentUpload";
import DocumentList from "./DocumentList";
import { FiUpload, FiFileText, FiClock, FiCheckCircle } from "react-icons/fi";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { documents = [], isLoading } = useSelector((state) => state.documents);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getDocuments());
  }, [dispatch]);

  // Calculate document statistics
  const stats = {
    total: documents?.length || 0,
    pending:
      documents?.filter((doc) => doc?.verificationStatus === "pending")
        ?.length || 0,
    verified:
      documents.filter((doc) => doc.verificationStatus === "verified")
        ?.length || 0,
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.firstName}! 👋</h1>
          <p className="text-base-content/70">
            Manage your documents and verifications here
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                  <FiUpload className="w-5 h-5 text-primary" />
                  <h2 className="card-title m-0">Upload Document</h2>
                </div>
                <DocumentUpload />
              </div>
            </div>
          </div>

          {/* Documents List Section */}
          <div className="lg:col-span-3">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiFileText className="w-5 h-5 text-primary" />
                    <h2 className="card-title m-0">Your Documents</h2>
                  </div>
                  <div className="badge badge-primary badge-outline">
                    {documents.length} Total
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FiFileText className="w-12 h-12 mx-auto text-base-content/30" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No Documents Yet
                    </h3>
                    <p className="text-base-content/70">
                      Upload your first document to get started
                    </p>
                  </div>
                ) : (
                  <DocumentList documents={documents} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
