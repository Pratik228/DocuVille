import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  verifyDocument,
  getDocuments,
} from "../../features/documents/documentSlice";
import { toast } from "react-toastify";

const AdminVerifyModal = ({ document, onClose }) => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState("verified");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!document?._id) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        verifyDocument({
          id: document._id,
          status,
          notes,
        })
      ).unwrap();

      await dispatch(getDocuments()); // Refresh the documents list
      toast.success(`Document marked as ${status}`);
      onClose();
    } catch (err) {
      toast.error(err || "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-lg shadow-xl w-96">
        <h3 className="text-lg font-bold mb-4">Verify Document</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="verified">Verify</option>
              <option value="rejected">Reject</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Notes</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24"
              placeholder="Add verification notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminVerifyModal;
