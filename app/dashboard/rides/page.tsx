"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowRight, Download, UserCircle, Car, AlertCircle, Bike, Zap } from "lucide-react"
import { useRides } from "@/features/rides/hooks/useRides"
import { useState } from "react"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatMonitorPanel } from "./components/ChatMonitorPanel"
import { exportToExcel } from "@/lib/exportUtils"
import { toast } from "sonner"
import Link from "next/link"

export default function RidesPage() {
    const [dateRange, setDateRange] = useState<{ from: Date, to?: Date } | undefined>()
    const { rides, loading } = useRides(dateRange)

    const handleExport = () => {
        const dataToExport = rides.map(r => ({
            "Ride ID": r.id,
            "Driver ID": r.driverId || "No Driver",
            "Driver Name": r.driverName || "—",
            "User ID": r.userId,
            "User Name": r.userName || "—",
            "Pickup": r.pickupAddress || r.pickupLocation?.address || r.pickupLoc?.address || 'Unknown',
            "Dropoff": r.destinationAddress || r.dropLocation?.address || 'Unknown',
            "Status": r.status,
            "Cancel Reason": r.cancelReason || "—",
            "Fare (₹)": r.fare || 0,
            "Date": r.timestamp || "N/A"
        }))

        exportToExcel(dataToExport, `Rurboo_Rides_Export`)
        toast.success(`Exported ${dataToExport.length} rides to Excel`)
    }

    const getVehicleInfo = (category?: string) => {
        const cat = (category || '').toLowerCase().trim()
        const labels: Record<string, string> = {
            'bike': 'Bike', 'e-rikshaw': 'E-Rikshaw', 'auto': 'Auto Rikshaw',
            'comfort car': 'Comfort Car', 'big car': 'Big Car', 'carrier truck': 'Carrier Truck'
        }
        const label = labels[cat] || category || 'Unknown'
        if (cat === 'bike' || cat.includes('bike') || cat.includes('moto')) {
            return { label, icon: <Bike className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-700 border-orange-200' }
        } else if (cat === 'e-rikshaw' || cat.includes('e-rik') || cat.includes('electric')) {
            return { label, icon: <Zap className="h-3.5 w-3.5" />, color: 'bg-green-100 text-green-700 border-green-200' }
        } else if (cat === 'auto' || cat.includes('auto')) {
            return { label, icon: <Zap className="h-3.5 w-3.5" />, color: 'bg-teal-100 text-teal-700 border-teal-200' }
        } else if (cat === 'comfort car' || cat.includes('comfort')) {
            return { label, icon: <Car className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200' }
        } else if (cat === 'big car' || cat.includes('big') || cat.includes('suv')) {
            return { label, icon: <Car className="h-3.5 w-3.5" />, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
        } else if (cat === 'carrier truck' || cat.includes('truck') || cat.includes('carrier')) {
            return { label, icon: <Bike className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-700 border-gray-200' }
        }
        return { label, icon: <Car className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-600 border-gray-200' }
    }

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            completed: "bg-green-100 text-green-800 border-green-200",
            started: "bg-blue-100 text-blue-800 border-blue-200",
            accepted: "bg-yellow-100 text-yellow-800 border-yellow-200",
            arrived: "bg-purple-100 text-purple-800 border-purple-200",
            cancelled: "bg-red-100 text-red-800 border-red-200",
            pending: "bg-gray-100 text-gray-700 border-gray-200",
        }
        return map[status] || "bg-gray-100 text-gray-700 border-gray-200"
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Ride Operations</h2>
                <div className="flex gap-2 items-center">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange as any} />
                    <Button variant="outline" className="gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> Export Excel
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="log" className="w-full">
                <TabsList className="mb-6 p-1 bg-secondary/50 border rounded-lg h-auto inline-flex flex-wrap gap-2">
                    <TabsTrigger value="log" className="py-2 px-4 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Master Ride Log</TabsTrigger>
                    <TabsTrigger value="radar" className="py-2 px-4 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-red-600 data-[state=active]:bg-red-600 data-[state=active]:text-white">Safety Radar</TabsTrigger>
                </TabsList>

                <TabsContent value="log" className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[90px]">Ride ID</TableHead>
                                    <TableHead>User (Booked By)</TableHead>
                                    <TableHead>Driver (Picked Up)</TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Fare</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                            Loading rides...
                                        </TableCell>
                                    </TableRow>
                                ) : rides.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                            No rides found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rides.map((ride) => (
                                        <TableRow key={ride.id} className="hover:bg-muted/30 transition-colors">
                                            {/* Ride ID */}
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {ride.id.substring(0, 8)}
                                            </TableCell>

                                            {/* User */}
                                            <TableCell>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={`/dashboard/users/${ride.userId}`}
                                                                className="flex items-center gap-1.5 group w-fit"
                                                            >
                                                                <UserCircle className="h-4 w-4 text-blue-500 shrink-0" />
                                                                <span className="text-xs font-medium group-hover:text-blue-600 group-hover:underline transition-colors">
                                                                    {ride.userName || ride.userId.substring(0, 8)}
                                                                </span>
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>User ID: {ride.userId}</p>
                                                            {ride.userName && <p>Name: {ride.userName}</p>}
                                                            <p className="text-xs text-muted-foreground mt-1">Click to view profile</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>

                                            {/* Driver */}
                                            <TableCell>
                                                {ride.driverId ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link
                                                                    href={`/dashboard/drivers/${ride.driverId}`}
                                                                    className="flex items-center gap-1.5 group w-fit"
                                                                >
                                                                    <Car className="h-4 w-4 text-green-500 shrink-0" />
                                                                    <span className="text-xs font-medium group-hover:text-green-600 group-hover:underline transition-colors">
                                                                        {ride.driverName || ride.driverId.substring(0, 8)}
                                                                    </span>
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p>Driver ID: {ride.driverId}</p>
                                                                {ride.driverName && <p>Name: {ride.driverName}</p>}
                                                                <p className="text-xs text-muted-foreground mt-1">Click to view profile</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">No driver assigned</span>
                                                )}
                                            </TableCell>

                                            {/* Vehicle Category */}
                                            <TableCell>
                                                {ride.vehicleCategory ? (() => {
                                                    const v = getVehicleInfo(ride.vehicleCategory)
                                                    return (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${v.color}`}>
                                                            {v.icon}
                                                            {v.label}
                                                        </span>
                                                    )
                                                })() : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>

                                            {/* Route */}
                                            <TableCell>
                                                <div className="flex items-center text-sm gap-1">
                                                    <span className="truncate max-w-[130px] text-xs">
                                                        {ride.pickupAddress || ride.pickupLocation?.address || ride.pickupLoc?.address || 'Unknown'}
                                                    </span>
                                                    <ArrowRight className="h-3.5 w-3.5 mx-1 text-muted-foreground shrink-0" />
                                                    <span className="truncate max-w-[130px] text-xs">
                                                        {ride.destinationAddress || ride.dropLocation?.address || 'Unknown'}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Status + Cancel Reason */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${getStatusBadge(ride.status)}`}>
                                                        {ride.status}
                                                    </span>
                                                    {ride.status === 'cancelled' && ride.cancelReason && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-1 text-xs text-red-500 cursor-pointer">
                                                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                                                        <span className="truncate max-w-[120px]">{ride.cancelReason}</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="max-w-[200px]">
                                                                    <p className="font-medium text-xs">Cancel Reason:</p>
                                                                    <p className="text-xs">{ride.cancelReason}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Fare */}
                                            <TableCell className="text-right font-medium text-sm">
                                                {ride.fare ? `₹ ${ride.fare}` : '—'}
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {(ride.timestamp as unknown as string) || 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    )))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="radar" className="animate-in fade-in-50">
                    <ChatMonitorPanel activeRides={rides.filter(r => r.status === 'started' || r.status === 'accepted')} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
