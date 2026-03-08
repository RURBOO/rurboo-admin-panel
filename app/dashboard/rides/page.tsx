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
import { MapPin, ArrowRight, Download } from "lucide-react"
import { useRides } from "@/features/rides/hooks/useRides"
import { useState } from "react"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { exportToExcel } from "@/lib/exportUtils"
import { toast } from "sonner"

export default function RidesPage() {
    const [dateRange, setDateRange] = useState<{ from: Date, to?: Date } | undefined>()
    const { rides, loading } = useRides(dateRange)

    const handleExport = () => {
        const dataToExport = rides.map(r => ({
            "Ride ID": r.id,
            "Driver ID": r.driverId || "Pending",
            "User ID": r.userId,
            "Pickup": r.pickupLocation?.address || 'Unknown',
            "Dropoff": r.dropLocation?.address || 'Unknown',
            "Status": r.status,
            "Fare (₹)": r.fare || 0,
            "Date": r.timestamp || "N/A"
        }))

        exportToExcel(dataToExport, `Rurboo_Rides_Export`)
        toast.success(`Exported ${dataToExport.length} rides to Excel`)
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

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ride ID</TableHead>
                            <TableHead>Driver ID</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Fare</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    Loading rides...
                                </TableCell>
                            </TableRow>
                        ) : rides.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    No rides found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rides.map((ride) => (
                                <TableRow key={ride.id}>
                                    <TableCell className="font-medium text-xs">{ride.id.substring(0, 8)}</TableCell>
                                    <TableCell className="text-xs">{ride.driverId ? ride.driverId.substring(0, 8) : 'Pending'}</TableCell>
                                    <TableCell className="text-xs">{ride.userId.substring(0, 8)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm">
                                            <span className="truncate max-w-[150px]">{ride.pickupLocation?.address || 'Unknown'}</span>
                                            <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                                            <span className="truncate max-w-[150px]">{ride.dropLocation?.address || 'Unknown'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            ride.status === 'completed' ? 'default' :
                                                ride.status === 'started' ? 'secondary' :
                                                    ride.status === 'cancelled' ? 'destructive' : 'outline'
                                        }>
                                            {ride.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{ride.fare ? `₹ ${ride.fare}` : '-'}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {(ride.timestamp as unknown as string) || 'N/A'}
                                    </TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
