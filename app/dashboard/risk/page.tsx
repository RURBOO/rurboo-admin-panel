"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, AlertTriangle, Activity } from "lucide-react"
import { useRisk } from "@/features/risk/hooks/useRisk"

export default function RiskPage() {
    const { alerts, loading } = useRisk()

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-red-700">Risk & SOS</h2>
                    <p className="text-muted-foreground">Monitor high-risk activities and safety alerts.</p>
                </div>
                <Button variant="destructive"><ShieldAlert className="mr-2 h-4 w-4" /> Emergency Broadcast</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-900">Active SOS Alerts</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">0</div>
                        <p className="text-xs text-red-600">System Normal</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Cancellations</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : alerts.length}</div>
                        <p className="text-xs text-muted-foreground">Flagged for review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">Check Drivers Tab</p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border p-4">
                <h3 className="text-lg font-semibold mb-4">Live Risk Feed</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Alert ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Driver/Ride</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    Scanning for risks...
                                </TableCell>
                            </TableRow>
                        ) : alerts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No high-risk activities detected.
                                </TableCell>
                            </TableRow>
                        ) : (
                            alerts.map((alert) => (
                                <TableRow key={alert.id}>
                                    <TableCell className="font-medium">{alert.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{alert.type}</span>
                                            {alert.score && <span className="text-xs text-muted-foreground font-bold">Score: {alert.score}/100</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' :
                                                alert.severity === 'medium' ? 'secondary' : 'outline'
                                        }>
                                            {alert.severity.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <div className="truncate">{alert.details}</div>
                                        {alert.factors && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {alert.factors.map((f, i) => (
                                                    <span key={i} className="text-[10px] bg-red-100 text-red-800 px-1 rounded">{f}</span>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs">{alert.driverId}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">{alert.timestamp}</TableCell>
                                </TableRow>
                            )))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
