import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";

const rows = [
  { id: "L-101", name: "Ravi", phone: "90004 69552", subject: "Party", status: "new" },
  { id: "L-102", name: "Sreya", phone: "90004 69552", subject: "Food Order", status: "contacted" },
  { id: "F-201", name: "Nikhil", phone: "90004 69552", subject: "Franchise", status: "new" }
];

export default function AdminLeads() {
  return (
    <AdminResourcePage
      title="Leads"
      description="View contact and franchise leads, update lead status, and open WhatsApp follow-ups."
      rows={rows}
      columns={[
        { key: "id", label: "Lead ID" },
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "subject", label: "Subject" },
        { key: "status", label: "Status", badge: true }
      ]}
      actions={["WhatsApp"]}
    />
  );
}
