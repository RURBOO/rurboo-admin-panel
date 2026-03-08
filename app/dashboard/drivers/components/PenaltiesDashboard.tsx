import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, ShieldAlert, Gavel, UserX } from "lucide-react"

export function PenaltiesDashboard() {
    const [penalties, setPenalties] = useState([
        { id: "P-101", driverName: "Karan Johar", reason: "3 Consecutive Cancellations", penalty: "24-Hour Ban", expiresAt: "Tomorrow, 2:00 PM" },
        { id: "P-102", driverName: "Vikram Seth", reason: "Multiple User Reports", penalty: "Account Under Review", expiresAt: "Pending Manual Review" }
    ])

    return (
        <div className="space-y-6">
            <Card className="border-red-200 bg-red-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        Automated Penalty Rules
                    </CardTitle>
                    <CardDescription>The system automatically flags and suspends drivers based on these operational violations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-md shadow-sm border text-sm">
                            <span className="font-semibold block mb-1">High Cancellation Rate</span>
                            If a driver drops 3 consecutive trips, 24-hr ban applied automatically.
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm border text-sm">
                            <span className="font-semibold block mb-1">Safety Reports</span>
                            If 2 unique users report safety concerns in 48 hours, instant account lock.
                        </div>
                        <div className="bg-white p-3 rounded-md shadow-sm border text-sm">
                            <span className="font-semibold block mb-1">Low Rating Threshold</span>
                            If average rating falls below 4.0 after 20 rides, driver requires training.
                        </div>
                    </div>
                </CardContent>
            </Card>

            <h3 className="text-xl font-medium mt-8 flex items-center gap-2">
                <Gavel className="w-5 h-5" /> Active Suspensions
            </h3>

            <div className="space-y-4">
                {penalties.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground border-dashed">
                        No active driver penalties at the moment. All systems nominal.
                    </Card>
                ) : (
                    penalties.map((penalty, idx) => (
                        <Card key={penalty.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row border-l-4 border-l-red-500">
                                <div className="p-4 md:w-1/4 bg-muted/20 border-r flex flex-col justify-center">
                                    <div className="font-semibold text-lg">{penalty.driverName}</div>
                                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                        <UserX className="w-3 h-3" /> Driver ID: {penalty.id.replace('P-', '')}
                                    </div>
                                </div>
                                <div className="p-4 md:w-2/4 flex flex-col justify-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="destructive">{penalty.penalty}</Badge>
                                        <span className="text-sm font-medium">Violation: {penalty.reason}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Expires: {penalty.expiresAt}
                                    </div>
                                </div>
                                <div className="p-4 md:w-1/4 flex gap-2 items-center justify-end border-t md:border-t-0 bg-muted/10">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        const newList = [...penalties];
                                        newList.splice(idx, 1);
                                        setPenalties(newList);
                                    }}>
                                        <ShieldAlert className="w-4 h-4 mr-2 text-orange-500" /> Overrule Ban
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
