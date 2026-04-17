import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children ? children : <Outlet />;
}

export function RoleGuard({ roles, children }) {
    const { hasRole } = useAuth();
    if (!hasRole(...roles)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
                <p className="text-slate-500 dark:text-slate-400">You don't have permission to view this page.</p>
            </div>
        );
    }
    return children ? children : <Outlet />;
}
