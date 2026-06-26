import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";
import { features, heroSlides, stats } from "../../data/siteData.js";

export default function AdminHomeContent() {
  const rows = [
    ...heroSlides.map((slide) => ({ id: slide.id, type: "Hero Slide", name: slide.caption, status: "active" })),
    ...stats.map((stat) => ({ id: stat.label, type: "Stats Bar", name: stat.label, status: "active" })),
    ...features.map((feature) => ({ id: feature.title, type: "Feature Card", name: feature.title, status: "active" }))
  ];
  return (
    <AdminResourcePage
      title="Home Content"
      description="Control hero slides, about copy, stats bar, featured menu items, and desktop franchise visibility."
      rows={rows}
      columns={[
        { key: "type", label: "Type" },
        { key: "name", label: "Content" },
        { key: "status", label: "Status", badge: true }
      ]}
      upload
    />
  );
}
