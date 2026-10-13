import { Navigate, useLocation, Outlet } from "react-router-dom";
import { getCurrentUser, isAuthenticated, hasRole } from "./currentUser";
import { ForbiddenPage } from "@/components/ui/NotFoundPage";

/**
 * RoleGuard Component
 * ===================
 * Guards routes based on authentication status and allowed user roles.
 *
 * Usage in AppRoutes:
 *   <Route element={<RoleGuard allowedRoles={["admin"]} />}>
 *     <Route path="inquiries" element={<InquiriesPage />} />
 *   </Route>
 *
 * @param {object} props
 * @param {string[]} [props.allowedRoles] - Roles allowed to access the route (e.g. ['admin', 'trainer'])
 * @param {React.ReactNode} [props.children]
 * @param {boolean} [props.requireAuth=true]
 */
export default function RoleGuard({
  allowedRoles = [],
  children,
  requireAuth = true,
}) {
  const location = useLocation();
  const authed = isAuthenticated();
  const user = getCurrentUser();

  // 1. Unauthenticated check
  if (requireAuth && !authed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // 2. Role authorization check
  if (allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <ForbiddenPage embedded />;
  }

  return children ? children : <Outlet />;
}
