"use client"

import Link from "next/link"
import Image from "next/image"
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
    MessageSquare,
    Bell,
    LogOut,
    UserCircle,
    Truck
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/AuthContext"
import { canAccessRoute } from "@/lib/rbac"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
        label: "Notifications",
        icon: Bell,
        href: "/dashboard/notifications",
        color: "text-purple-600",
    },
    {
        label: "Feedback",
        icon: MessageSquare, // Alternatively could use MessageCircle or similar
        href: "/dashboard/feedback",
        color: "text-indigo-600",
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
        label: "Inventory",
        icon: Truck,
        href: "/dashboard/inventory",
        color: "text-amber-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings",
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const { user, role, permissions } = useAuth()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await signOut(auth)
            router.replace('/login')
        } catch (error) {
            console.error("Logout failed", error)
            toast.error("Failed to log out. Please try again.")
        }
    }

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
                        <div className="p-6">
                            <div className="flex items-center gap-2 font-bold text-2xl mb-8 text-white">
                                <div className="relative h-10 w-32 rounded-md overflow-hidden bg-white/10 p-1">
                                    <Image
                                        src="/logo.jpg"
                                        alt="Rurboo Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </Link>
                    <div className="space-y-1">
                        <div className="space-y-1">
                            {routes.map((route) => {
                                // RBAC Check
                                // We construct the full path to check permissions
                                if (!canAccessRoute(role || undefined, route.href, permissions || undefined)) return null;

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

                {/* Footer User Profile & Logout */}
                {user && (
                    <div className="mt-auto px-4 py-4 border-t border-white/10 bg-slate-900/50 flex flex-col items-start w-full">
                        <div className="flex items-center gap-2 mb-3 px-1 w-full overflow-hidden">
                            <UserCircle className="h-6 w-6 text-zinc-400 shrink-0" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-white truncate max-w-full">
                                    {user.email}
                                </span>
                                {role && (
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                        {role.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full justify-start text-xs h-9 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border border-red-900/50"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                )}
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
