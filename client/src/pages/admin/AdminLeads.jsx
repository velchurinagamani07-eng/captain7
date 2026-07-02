import { useAdminCollection } from "../../hooks/useAdminCollection.js";
import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";

export default function AdminLeads() {
  const { data: contacts, save: saveContact, remove: removeContact } = useAdminCollection("contactLeads", "createdAt");
  const { data: franchises, save: saveFranchise, remove: removeFranchise } = useAdminCollection("franchiseLeads", "createdAt");

  const rows = [
    ...contacts.map(c => ({ ...c, type: "Contact" })),
    ...franchises.map(f => ({ ...f, type: "Franchise", subject: "Franchise Application" }))
  ];

  const handleSave = async (payload, id) => {
    if (payload.type === "Franchise") {
      await saveFranchise(id, { name: payload.name, phone: payload.phone, subject: payload.subject || "Franchise Application", status: payload.status });
    } else {
      await saveContact(id, { name: payload.name, phone: payload.phone, subject: payload.subject || "Contact Query", status: payload.status });
    }
  };

  const handleDelete = async (row) => {
    if (row.type === "Franchise") {
      await removeFranchise(row.id);
    } else {
      await removeContact(row.id);
    }
  };

  const handleAction = (action, row) => {
    if (action === "WhatsApp") {
      const cleanPhone = row.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone.startsWith("91") ? "" : "91"}${cleanPhone}`, "_blank");
    }
  };

  const formFields = [
    { key: "type", label: "Type", type: "select", options: ["Contact", "Franchise"], required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "phone", label: "Phone", type: "text", required: true },
    { key: "subject", label: "Subject / Query", type: "text" },
    { key: "status", label: "Status", type: "select", options: ["new", "contacted", "closed"], required: true }
  ];

  return (
    <AdminResourcePage
      title="Leads"
      description="View contact and franchise leads, update lead status, and open WhatsApp follow-ups."
      rows={rows}
      columns={[
        { key: "id", label: "Lead ID" },
        { key: "type", label: "Type" },
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "subject", label: "Subject" },
        { key: "status", label: "Status", badge: true }
      ]}
      actions={["WhatsApp"]}
      formFields={formFields}
      onSave={handleSave}
      onDelete={handleDelete}
      onAction={handleAction}
    />
  );
}
