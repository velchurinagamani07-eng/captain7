import { useAdminCollection } from "../../hooks/useAdminCollection.js";
import { AdminResourcePage } from "../../components/admin/AdminResourcePage.jsx";

export default function AdminUsers() {
  const { data, save } = useAdminCollection("users", "createdAt");

  const handleSave = async (payload, id) => {
    await save(id, payload);
  };

  const handleAction = async (action, row) => {
    if (action === "Block") {
      const newStatus = row.status === "blocked" ? "active" : "blocked";
      await save(row.id, { ...row, status: newStatus });
    } else if (action === "Role") {
      const roles = ["user", "worker", "admin"];
      const nextRoleIndex = (roles.indexOf(row.role || "user") + 1) % roles.length;
      await save(row.id, { ...row, role: roles[nextRoleIndex] });
    }
  };

  const formFields = [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "role", label: "Role", type: "select", options: ["user", "worker", "admin"], required: true },
    { key: "loyaltyPoints", label: "Loyalty Points", type: "number" },
    { key: "status", label: "Status", type: "select", options: ["active", "blocked"], required: true }
  ];

  const rows = data.map(u => ({
    ...u,
    status: u.status || "active"
  }));

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
      collectionName="users"
      formFields={formFields}
      onSave={handleSave}
      onAction={handleAction}
    />
  );
}
