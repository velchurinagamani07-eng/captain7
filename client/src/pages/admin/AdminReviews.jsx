import { useAdminCollection } from "../../hooks/useAdminCollection.js";
import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";
import { reviews } from "../../data/siteData.js";

export default function AdminReviews() {
  const { data, save } = useAdminCollection("reviews", "createdAt");
  const rows = data.length ? data : reviews;

  const handleSave = async (payload, id) => {
    await save(id, payload);
  };

  const handleAction = async (action, row) => {
    if (action === "Pin") {
      const newStatus = row.status === "pinned" ? "active" : "pinned";
      await save(row.id, { ...row, status: newStatus });
    }
  };

  const formFields = [
    { key: "name", label: "Reviewer Name", type: "text", required: true },
    { key: "stars", label: "Stars (1-5)", type: "number", required: true, min: 1, max: 5 },
    { key: "date", label: "Date / Time Ago", type: "text" },
    { key: "text", label: "Review Content", type: "textarea", required: true },
    { key: "status", label: "Status", type: "select", options: ["pinned", "active", "inactive"], required: true }
  ];

  return (
    <AdminResourcePage
      title="Google Reviews"
      description="Fetch through /api/reviews, pin reviews for homepage display, or add manual offline reviews."
      rows={rows}
      columns={[
        { key: "name", label: "Name" },
        { key: "stars", label: "Stars" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status", badge: true }
      ]}
      actions={["Pin"]}
      collectionName="reviews"
      formFields={formFields}
      onSave={handleSave}
      onAction={handleAction}
    />
  );
}
