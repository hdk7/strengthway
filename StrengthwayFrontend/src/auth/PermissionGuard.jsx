import { Navigate, useLocation, Outlet } from "react-router-dom";
import { isAuthenticated } from "./currentUser";
import { can } from "./permissions";
import { ForbiddenPage } from "@/components/ui/NotFoundPage";

/**
 * PermissionGuard Component
 * =========================
 * Guards routes based on dynamic module and action permissions.
 *
 * Usage in AppRoutes:
 *   <Route element={<PermissionGuard module="attendance" action="view" />}>
 *     <Route path="attendance/members" element={<MembersAttendancePage />} />
 *   </Route>
 */
export default function PermissionGuard({
  module: moduleName,
  action = "view",
  children,
  requireAuth = true,
}) {
  const location = useLocation();
  const authed = isAuthenticated();

  if (requireAuth && !authed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (moduleName && !can(moduleName, action)) {
    return <ForbiddenPage embedded />;
  }

  return children ? children : <Outlet />;
}
