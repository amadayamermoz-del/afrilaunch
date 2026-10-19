import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminDashboard } from "./admin-dashboard";
import "./admin-dashboard.css";

export default function AdminPage() {
  return (
    <ProtectedRoute role="ADMIN">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
