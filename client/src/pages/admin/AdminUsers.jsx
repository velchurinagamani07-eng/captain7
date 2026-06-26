import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";

const rows = [
  { id: "U-1", name: "Captain Guest", email: "guest@captain7.local", role: "user", loyaltyPoints: 70, status: "active" },
  { id: "U-2", name: "Admin", email: "admin@captain7.local", role: "admin", loyaltyPoints: 0, status: "active" }
];

export default function AdminUsers() {
  return (
    <AdminResourcePage
      title="Users"
      description="Manage roles, blocked status, loyalty points, review prompt visibility, and profile data."
      rows={rows}
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "loyaltyPoints", label: "Points" },
        { key: "status", label: "Status", badge: true }
      ]}
      actions={["Block", "Role"]}
    />
  );
}
