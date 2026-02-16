"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, CreditCard, Users, RefreshCw, TrendingUp, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats"
import { useVehicleRideStats } from "@/features/dashboard/hooks/useVehicleRideStats"
import { useUserOnboarding, TimePeriod } from "@/features/dashboard/hooks/useUserOnboarding"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
    const { totalRevenue, activeDrivers, totalUsers, activeRides, loading } = useDashboardStats()
    const { totalRides, todayRides, vehicleStats, loading: ridesLoading } = useVehicleRideStats()
    const [onboardingPeriod, setOnboardingPeriod] = useState<TimePeriod>('daily')
    const { data: onboardingData, totalInPeriod, loading: onboardingLoading } = useUserOnboarding(onboardingPeriod)

    // Format revenue in Indian currency format
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Format vehicle type for display
    const formatVehicleType = (type: string) => {
        const mapping: { [key: string]: string } = {
            "BIKE_TAXI": "Bike Taxi",
            "AUTO_RICKSHAW": "Auto Rickshaw",
            "E_RICKSHAW": "E-Rickshaw",
            "CAR_MINI": "Car/Mini",
            "SUV_XL": "SUV/XL",
            "TRUCK_CARRIER": "Truck/Carrier"
        }
        return mapping[type] || type
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

            {/* Main Stats Cards */}
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

            {/* Rides Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Ride Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Total Rides
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {ridesLoading ? "..." : totalRides.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            Today's Rides
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-green-600">
                                            {ridesLoading ? "..." : todayRides.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Since midnight</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="vehicles">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {vehicleStats.map((vehicle) => (
                                    <Card key={vehicle.vehicleType}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {formatVehicleType(vehicle.vehicleType)}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Total Rides</div>
                                                    <div className="text-2xl font-bold">
                                                        {ridesLoading ? "..." : vehicle.totalRides.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Today's Rides</div>
                                                    <div className="text-xl font-bold text-green-600">
                                                        {ridesLoading ? "..." : vehicle.todayRides.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* User Onboarding Analytics */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            User Onboarding Analytics
                        </CardTitle>
                        <Select value={onboardingPeriod} onValueChange={(value) => setOnboardingPeriod(value as TimePeriod)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="3months">3 Months</SelectItem>
                                <SelectItem value="6months">6 Months</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="text-sm text-muted-foreground">Total New Users in Period</div>
                                <div className="text-3xl font-bold">
                                    {onboardingLoading ? "..." : totalInPeriod.toLocaleString()}
                                </div>
                            </div>
                            <Calendar className="h-12 w-12 text-muted-foreground" />
                        </div>

                        {/* Simple data display */}
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">Recent Activity:</div>
                            {onboardingLoading ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : onboardingData.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No data available for this period</div>
                            ) : (
                                <div className="grid gap-1 max-h-[200px] overflow-y-auto">
                                    {onboardingData.slice(-10).reverse().map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm border-b pb-1">
                                            <span className="text-muted-foreground">{item.date}</span>
                                            <span className="font-medium">{item.count} users</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Live Stats (existing) */}
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
