"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Car,
    CreditCard,
    MapPin,
    Settings,
    ShieldAlert,
    Menu,
    X,
    MessageSquare
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/AuthContext"
import { canAccessRoute } from "@/lib/rbac"

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Live Map",
        icon: MapPin,
        href: "/dashboard/map",
        color: "text-emerald-500",
    },
    {
        label: "Drivers",
        icon: Car,
        href: "/dashboard/drivers",
        color: "text-violet-500",
    },
    {
        label: "Rides",
        icon: Menu, // Using Menu temporarily, can be changed to specific Ride icon
        href: "/dashboard/rides",
        color: "text-pink-700",
    },
    {
        label: "Finance",
        icon: CreditCard,
        href: "/dashboard/finance",
        color: "text-orange-700",
    },
    {
        label: "Users",
        icon: Users,
        href: "/dashboard/users",
        color: "text-green-700",
    },
    {
        label: "Support",
        icon: MessageSquare,
        href: "/dashboard/support",
        color: "text-blue-600",
    },
    {
        label: "Risk & SOS",
        icon: ShieldAlert,
        href: "/dashboard/risk",
        color: "text-red-700",
    },
    {
        label: "Pricing",
        icon: CreditCard, // Reusing CreditCard or finding another like Banknote if available, but consistent with lucide
        href: "/dashboard/pricing",
        color: "text-yellow-600",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings",
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const { role } = useAuth()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    return (
        <>
            {/* Mobile Trigger */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)}>
                    {isMobileOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Sidebar Container */}
            <div className={cn(
                "space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white fixed md:relative z-40 w-64 transition-transform duration-200 ease-in-out md:translate-x-0",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="px-3 py-2 flex-1">
                    <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                        <h1 className="text-2xl font-bold">
                            Rurboo <span className="text-primary">Admin</span>
                        </h1>
                    </Link>
                    <div className="space-y-1">
                        <div className="space-y-1">
                            {routes.map((route) => {
                                // RBAC Check
                                // We construct the full path to check permissions
                                if (!canAccessRoute(role || undefined, route.href)) return null;

                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        className={cn(
                                            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                            pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                                        )}
                                    >
                                        <div className="flex items-center flex-1">
                                            <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                            {route.label}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    )
}
