import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";
import { defaultAnnouncementMessages } from "../../components/common/AnnouncementBar.jsx";

export default function AdminAnnouncements() {
  return (
    <AdminResourcePage
      title="Announcements"
      description="Edit the top announcement bar messages stored at /settings/announcements."
      rows={defaultAnnouncementMessages.map((message, index) => ({
        id: `announcement-${index + 1}`,
        text: message.text,
        highlight: message.highlight || "",
        cta: message.cta,
        link: message.link,
        status: "active"
      }))}
      columns={[
        { key: "text", label: "Text" },
        { key: "highlight", label: "Highlight" },
        { key: "cta", label: "CTA" },
        { key: "link", label: "Link" },
        { key: "status", label: "Status", badge: true }
      ]}
    />
  );
}
