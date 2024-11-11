import { useState } from "react";
import DocumentCard from "./DocumentCard";
import { FiSearch } from "react-icons/fi";

const DocumentList = ({ documents = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocuments = documents?.filter((doc) => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    const docNumber = doc?.documentNumber || "";
    const docName = doc?.name || "";

    return (
      docNumber.toLowerCase().includes(searchLower) ||
      docName.toLowerCase().includes(searchLower)
    );
  });

  const getDocumentKey = (doc) => {
    // Ensure we always have a unique key, even if _id is not available
    if (doc._id) return doc._id;
    if (doc.id) return doc.id;
    // If neither _id nor id exists, create a unique key from the document data
    return `${doc.documentNumber}-${doc.createdAt}`;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-base-content/50" />
        </div>
        <input
          type="text"
          className="input input-bordered w-full pl-10"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {!filteredDocuments?.length ? (
          <div className="text-center py-4 text-base-content/70">
            {searchTerm
              ? "No matching documents found"
              : "No documents uploaded yet"}
          </div>
        ) : (
          filteredDocuments.map((doc, index) => {
            const key = getDocumentKey(doc);
            if (!key) {
              console.warn("Document without proper ID:", doc);
              // Fallback key using index (not ideal but better than undefined)
              return <DocumentCard key={`doc-${index}`} document={doc} />;
            }
            return <DocumentCard key={key} document={doc} />;
          })
        )}
      </div>
    </div>
  );
};

export default DocumentList;
