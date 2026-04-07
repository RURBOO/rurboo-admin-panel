"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Car, CreditCard, Users, RefreshCw, TrendingUp, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats"
import { useVehicleRideStats } from "@/features/dashboard/hooks/useVehicleRideStats"
import { useUserOnboarding, TimePeriod } from "@/features/dashboard/hooks/useUserOnboarding"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend } from 'recharts'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
    const { totalRevenue, platformRevenue, activeDrivers, totalUsers, activeRides, revenueData, vehicleRevenueData, ridesBreakdownData, registrationGrowthData, loading } = useDashboardStats()

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
            // New exact names
            "bike": "Bike",
            "e-rikshaw": "E-Rikshaw",
            "auto": "Auto Rikshaw",
            "comfort car": "Comfort Car",
            "big car": "Big Car",
            "carrier truck": "Carrier Truck",
            // Legacy keys (backward compat)
            "BIKE_TAXI": "Bike",
            "AUTO_RICKSHAW": "Auto Rikshaw",
            "E_RICKSHAW": "E-Rikshaw",
            "CAR_MINI": "Comfort Car",
            "SUV_XL": "Big Car",
            "TRUCK_CARRIER": "Carrier Truck"
        }
        return mapping[type] || mapping[type.toLowerCase()] || type
    }

    const stats = [
        {
            title: "Total Revenue",
            value: formatCurrency(totalRevenue),
            change: "From completed rides",
            icon: CreditCard,
        },
        {
            title: "Platform Revenue",
            value: formatCurrency(platformRevenue),
            change: "Total commission earned",
            icon: TrendingUp,
        },
        {
            title: "Active Drivers",
            value: activeDrivers.toString(),

            change: "Verified & online",
            icon: Car,
        },
        {
            title: "Total Users",
            value: totalUsers.toString(),
            change: "Registered riders",
            icon: Users,
        },
        {
            title: "Active Rides",
            value: activeRides.toString(),
            change: "Currently on-trip",
            icon: RefreshCw,
        },
    ]

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Overview of your platform's performance.</p>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                </Button>
            </div>

            {/* Main Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-8 w-1/2 mb-1" />
                            ) : (
                                <div className="text-2xl font-bold">{stat.value}</div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {stat.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue & Live Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>
                            Daily revenue for the last 7 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₹${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Live Stats</CardTitle>
                        <CardDescription>
                            Real-time platform metrics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Active Drivers</span>
                                {loading ? <Skeleton className="h-6 w-12" /> : <span className="text-2xl font-bold text-green-600">{activeDrivers}</span>}
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(activeDrivers / 100) * 100}%` }} />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Live Rides</span>
                                {loading ? <Skeleton className="h-6 w-12" /> : <span className="text-2xl font-bold text-blue-600">{activeRides}</span>}
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(activeRides / (activeDrivers || 1)) * 100}%` }} />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Registered Users</span>
                                {loading ? <Skeleton className="h-6 w-12" /> : <span className="text-2xl font-bold text-purple-600">{totalUsers}</span>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue by Vehicle</CardTitle>
                        <CardDescription>
                            Revenue distribution across vehicle types.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={vehicleRevenueData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="type"
                                            type="category"
                                            tickFormatter={formatVehicleType}
                                            width={100}
                                            fontSize={12}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {vehicleRevenueData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'][index % 6]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Platform Earnings & Ride Outcomes</CardTitle>
                        <CardDescription>
                            Net Revenue vs Platform Commission, alongside active Ride Completion rates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-[300px] items-center justify-between gap-4">
                            <div className="text-center space-y-4 flex-1 border-r pr-4">
                                <TrendingUp className="h-12 w-12 text-primary mx-auto opacity-20" />
                                <div>
                                    <div className="text-4xl font-bold">{formatCurrency(platformRevenue)}</div>
                                    <div className="text-sm text-muted-foreground mt-1">Platform has retained {((platformRevenue / (totalRevenue || 1)) * 100).toFixed(1)}% of volume</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-muted-foreground">Driver Payouts</div>
                                        <div className="text-lg font-bold">{formatCurrency(totalRevenue - platformRevenue)}</div>
                                    </div>
                                    <div className="text-left border-l pl-4">
                                        <div className="text-sm font-medium text-muted-foreground">Platform Fee</div>
                                        <div className="text-lg font-bold text-green-600">{formatCurrency(platformRevenue)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 h-full pl-4 relative">
                                {loading ? <Skeleton className="w-full h-full" /> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={ridesBreakdownData || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {ridesBreakdownData?.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.name === 'Completed' ? '#10b981' : '#ef4444'} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Rides & Onboarding */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* User Onboarding Analytics */}
                <Card className="col-span-3">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Platform Acquisition
                            </CardTitle>
                        </div>
                        <CardDescription>Registration growth over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full mt-4">
                            {loading ? (
                                <Skeleton className="h-full w-full" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={registrationGrowthData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="users" name="New Users" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="drivers" name="New Drivers" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Ride Stats Tab */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Ride Operations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="vehicles">Vehicle Breakdown</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Total Lifetime Rides</h4>
                                        {ridesLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-3xl font-bold">{totalRides.toLocaleString()}</div>}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">Rides Today</h4>
                                        {ridesLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-3xl font-bold text-green-600">{todayRides.toLocaleString()}</div>}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="vehicles">
                                <div className="grid gap-4 md:grid-cols-3">
                                    {ridesLoading ? (
                                        Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                                    ) : (
                                        vehicleStats.map((vehicle) => (
                                            <div key={vehicle.vehicleType} className="bg-secondary/50 p-3 rounded-lg border">
                                                <div className="text-xs font-medium text-muted-foreground mb-1 truncate" title={formatVehicleType(vehicle.vehicleType)}>
                                                    {formatVehicleType(vehicle.vehicleType)}
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-bold">{vehicle.totalRides}</span>
                                                    <span className="text-[10px] text-muted-foreground">total</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
