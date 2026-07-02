import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.js";
import { useDocument } from "../../hooks/useFirestore.js";
import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";
import { defaultAnnouncementMessages } from "../../components/common/AnnouncementBar.jsx";

export default function AdminAnnouncements() {
  const { data } = useDocument("settings/announcements", { messages: defaultAnnouncementMessages });
  const messages = data.messages || defaultAnnouncementMessages;

  const rows = messages.map((message, index) => ({
    id: String(index),
    text: message.text,
    highlight: message.highlight || "",
    cta: message.cta || "",
    link: message.link || "",
    isActive: message.isActive !== false,
    status: message.isActive !== false ? "active" : "inactive"
  }));

  const handleSave = async (payload, id) => {
    let updated;
    const formattedPayload = {
      text: payload.text,
      highlight: payload.highlight || "",
      cta: payload.cta || "",
      link: payload.link || "",
      isActive: payload.isActive ?? true
    };

    if (id !== null && id !== undefined) {
      updated = messages.map((m, index) => String(index) === String(id) ? formattedPayload : m);
    } else {
      updated = [...messages, formattedPayload];
    }
    await setDoc(doc(db, "settings", "announcements"), { messages: updated });
  };

  const handleDelete = async (row) => {
    const updated = messages.filter((m, index) => String(index) !== String(row.id));
    await setDoc(doc(db, "settings", "announcements"), { messages: updated });
  };

  const formFields = [
    { key: "text", label: "Announcement Text", type: "text", required: true },
    { key: "highlight", label: "Highlight (e.g. Rs. 2.5 LAKHS)", type: "text" },
    { key: "cta", label: "CTA Button Label", type: "text" },
    { key: "link", label: "Link / Route / Phone", type: "text" },
    { key: "isActive", label: "Active", type: "boolean" }
  ];

  return (
    <AdminResourcePage
      title="Announcements"
      description="Edit the top announcement bar messages stored at /settings/announcements."
      rows={rows}
      columns={[
        { key: "text", label: "Text" },
        { key: "highlight", label: "Highlight" },
        { key: "cta", label: "CTA" },
        { key: "link", label: "Link" },
        { key: "status", label: "Status", badge: true }
      ]}
      formFields={formFields}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}
