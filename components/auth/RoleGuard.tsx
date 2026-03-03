"use client"

import { useAuth } from "@/features/auth/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { canAccessRoute } from "@/lib/rbac"
import { RefreshCw } from "lucide-react"

export default function RoleGuard({ children }: { children: React.ReactNode }) {
    const { user, role, permissions, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/") // Redirect to Login if not auth
            } else if (!canAccessRoute(role || undefined, pathname, permissions || undefined)) {
                // Determine redirect based on role
                if (role === 'finance') router.push("/dashboard/finance")
                else if (role === 'support') router.push("/dashboard/support")
                else if (role === 'risk_analyst') router.push("/dashboard/risk")
                else router.push("/dashboard") // Fallback (operators should always be allowed here now)
            }
        }
    }, [user, role, permissions, loading, pathname, router])

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Allow render if user is auth and has permission
    if (!user || !canAccessRoute(role || undefined, pathname, permissions || undefined)) {
        return null
    }

    return <>{children}</>
}
