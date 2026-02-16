"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, CreditCard, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats"

export default function DashboardPage() {
    const { totalRevenue, activeDrivers, totalUsers, activeRides, loading } = useDashboardStats()

    // Format revenue in Indian currency format
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const stats = [
        {
            title: "Total Revenue",
            value: loading ? "Loading..." : formatCurrency(totalRevenue),
            change: "From completed rides",
            icon: CreditCard,
        },
        {
            title: "Active Drivers",
            value: loading ? "..." : activeDrivers.toString(),
            change: "Verified & online",
            icon: Car,
        },
        {
            title: "Total Users",
            value: loading ? "..." : totalUsers.toString(),
            change: "Registered riders",
            icon: Users,
        },
        {
            title: "Active Rides",
            value: loading ? "..." : activeRides.toString(),
            change: "Currently on-trip",
            icon: RefreshCw,
        },
    ]

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <Button>Download Report</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                            Revenue Chart (Coming Soon)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Live Stats</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Real-time platform metrics
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Active Drivers</span>
                                <span className="text-2xl font-bold text-green-600">{loading ? "..." : activeDrivers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Live Rides</span>
                                <span className="text-2xl font-bold text-blue-600">{loading ? "..." : activeRides}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Users</span>
                                <span className="text-2xl font-bold text-purple-600">{loading ? "..." : totalUsers}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
