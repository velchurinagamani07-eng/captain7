import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";
import { reviews } from "../../data/siteData.js";

export default function AdminReviews() {
  return (
    <AdminResourcePage
      title="Google Reviews"
      description="Fetch through /api/reviews, pin reviews for homepage display, or add manual offline reviews."
      rows={reviews.map((review) => ({ ...review, status: "pinned" }))}
      columns={[
        { key: "name", label: "Name" },
        { key: "stars", label: "Stars" },
        { key: "date", label: "Date" },
        { key: "status", label: "Status", badge: true }
      ]}
      actions={["Pin"]}
    />
  );
}
