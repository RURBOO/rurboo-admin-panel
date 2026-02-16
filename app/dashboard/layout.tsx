"use client"

import { AppSidebar } from "@/components/layout/Sidebar"
import RoleGuard from "@/components/auth/RoleGuard"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <AppSidebar />
            </div>
            <main className="md:pl-72">
                <RoleGuard>
                    {children}
                </RoleGuard>
            </main>
        </div>
    )
}
