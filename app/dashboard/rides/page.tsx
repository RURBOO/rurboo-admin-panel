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
import { MapPin, ArrowRight } from "lucide-react"
import { useRides } from "@/features/rides/hooks/useRides"

export default function RidesPage() {
    const { rides, loading } = useRides()

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Ride Operations</h2>
                <Button variant="outline">Export History</Button>
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
