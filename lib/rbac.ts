export type Role = 'super_admin' | 'admin' | 'finance' | 'support' | 'risk_analyst';

export const ROLES: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    finance: 'Finance Manager',
    support: 'Support Agent',
    risk_analyst: 'Risk Analyst'
};

// Maps URL paths to allowed roles
export const MODULE_ACCESS: Record<string, Role[]> = {
    '/dashboard': ['super_admin', 'admin', 'finance', 'support', 'risk_analyst'],
    '/dashboard/pricing': ['super_admin'], // Only super admin can edit pricing
    '/dashboard/drivers': ['super_admin', 'admin', 'risk_analyst'],
    '/dashboard/rides': ['super_admin', 'admin', 'support'],
    '/dashboard/finance': ['super_admin', 'finance'],
    '/dashboard/risk': ['super_admin', 'risk_analyst'],
    '/dashboard/users': ['super_admin', 'admin', 'support'],
    '/dashboard/support': ['super_admin', 'admin', 'support'],
};

export function canAccessRoute(role: string | undefined, path: string): boolean {
    if (!role) return false;
    if (role === 'super_admin') return true;

    // Check exact path match
    if (MODULE_ACCESS[path] && MODULE_ACCESS[path].includes(role as Role)) {
        return true;
    }

    // Check parent path match
    const parentPath = Object.keys(MODULE_ACCESS).find(key => path.startsWith(key) && key !== '/dashboard');
    if (parentPath && MODULE_ACCESS[parentPath].includes(role as Role)) {
        return true;
    }

    return false;
}
