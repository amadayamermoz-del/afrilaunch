import type { ReactNode } from "react";
import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import "./dashboard.css";

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ProtectedRoute role="USER">
      <UserDashboardShell>{children}</UserDashboardShell>
    </ProtectedRoute>
  );
}
