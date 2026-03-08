"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BatteryCharging, Truck, AlertCircle, Wrench, CheckCircle2 } from "lucide-react"
import { collection, onSnapshot, query, setDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function InventoryPage() {
    const [vehicles, setVehicles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, "inventory_vehicles"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rawDocs: any[] = []
            snapshot.forEach((doc) => {
                rawDocs.push({ id: doc.id, ...doc.data() })
            })
            setVehicles(rawDocs)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    return (
        <div className="p-8 space-y-8 h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fleet Inventory</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage company-owned electric vehicles, monitor battery health, and track service requests.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Wrench className="w-4 h-4 mr-2" /> Schedule Service</Button>
                    <Button><Truck className="w-4 h-4 mr-2" /> Add Vehicle</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-emerald-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-50/50">
                        <CardTitle className="text-sm font-medium">Active Fleet</CardTitle>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'active').length}</div>
                        <p className="text-xs text-muted-foreground">Vehicles currently on road</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-orange-50/50">
                        <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
                        <Wrench className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'maintenance').length}</div>
                        <p className="text-xs text-muted-foreground">In service centers</p>
                    </CardContent>
                </Card>
                <Card className="border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50/50">
                        <CardTitle className="text-sm font-medium">Critical Battery &lt; 20%</CardTitle>
                        <BatteryCharging className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-red-600">{vehicles.filter(v => v.battery < 20).length}</div>
                        <p className="text-xs text-muted-foreground">Requires immediate charging</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{vehicles.filter(v => !v.driver || v.driver === 'Unassigned').length}</div>
                        <p className="text-xs text-muted-foreground">Ready for deployment</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Asset Registry</CardTitle>
                    <CardDescription>Comprehensive list of all managed physical vehicle assets.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset ID</TableHead>
                                    <TableHead>Vehicle Model</TableHead>
                                    <TableHead>Assigned Driver</TableHead>
                                    <TableHead>Health State</TableHead>
                                    <TableHead>Battery Level</TableHead>
                                    <TableHead>Next Service</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">Loading fleet data...</TableCell>
                                    </TableRow>
                                ) : vehicles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">No vehicles found in inventory.</TableCell>
                                    </TableRow>
                                ) : vehicles.map((v) => (
                                    <TableRow key={v.id}>
                                        <TableCell className="font-mono font-medium">{v.id}</TableCell>
                                        <TableCell>{v.model}</TableCell>
                                        <TableCell className="text-muted-foreground">{v.driver || 'Unassigned'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                v.status === 'active' ? 'default' :
                                                    v.status === 'flagged' ? 'destructive' : 'secondary'
                                            } className={v.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {(v.status || "Unknown").toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className={`h-full ${v.battery < 20 ? 'bg-red-500' : v.battery < 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${v.battery || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{v.battery || 0}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {v.nextService || "N/A"}
                                            <div className="text-xs text-muted-foreground">{v.condition || ""}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Manage</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
