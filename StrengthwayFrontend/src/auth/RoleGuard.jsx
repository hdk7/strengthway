import { Navigate, useLocation, Outlet } from "react-router-dom";
import { getCurrentUser, isAuthenticated, hasRole } from "./currentUser";
import { can } from "./permissions";
import { ForbiddenPage } from "@/components/ui/NotFoundPage";

/**
 * RoleGuard Component
 * ===================
 * Guards routes based on authentication status, allowed user roles,
 * and dynamic module-level RBAC permissions.
 *
 * Usage in AppRoutes:
 *   <Route element={<RoleGuard allowedRoles={["admin", "trainer"]} module="attendance" action="view" />}>
 *     <Route path="attendance/members" element={<MembersAttendancePage />} />
 *   </Route>
 *
 * @param {object} props
 * @param {string[]} [props.allowedRoles] - Roles allowed to access the route (e.g. ['admin', 'trainer'])
 * @param {string} [props.module] - Target module name to check dynamic permission (e.g. 'attendance', 'payments')
 * @param {string} [props.action='view'] - Required action on the module
 * @param {React.ReactNode} [props.children]
 * @param {boolean} [props.requireAuth=true]
 */
export default function RoleGuard({
  allowedRoles = [],
  module: moduleName,
  action = "view",
  children,
  requireAuth = true,
}) {
  const location = useLocation();
  const authed = isAuthenticated();

  // 1. Unauthenticated check
  if (requireAuth && !authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // 2. Role authorization check
  if (allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    const user = getCurrentUser();
    if (user?.role === "admin" && (location.pathname.startsWith("/trainer") || location.pathname.startsWith("/member"))) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user?.role === "trainer" && (location.pathname.startsWith("/admin") || location.pathname.startsWith("/member"))) {
      return <Navigate to="/trainer/dashboard" replace />;
    }
    if (user?.role === "member" && (location.pathname.startsWith("/admin") || location.pathname.startsWith("/trainer"))) {
      return <Navigate to="/member/dashboard" replace />;
    }
    return <ForbiddenPage embedded />;
  }

  // 3. Dynamic RBAC permission check
  if (moduleName && !can(moduleName, action)) {
    return <ForbiddenPage embedded />;
  }

  return children ? children : <Outlet />;
}
