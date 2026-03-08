import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, Map, IndianRupee, Gavel, CheckCircle2 } from "lucide-react"

export function DisputeEnginePanel() {
    const [disputes] = useState([
        {
            id: "RUR-9921",
            driverName: "Sanjay Kumar",
            userName: "Amit Sharma",
            issue: "Driver took a longer route causing 30 min delay.",
            status: "requires_action",
            fare: 450,
            estimatedFare: 320
        },
        {
            id: "RUR-8843",
            driverName: "Rahul Singh",
            userName: "Priya Patel",
            issue: "AC was not working despite selecting Prime.",
            status: "investigating",
            fare: 600,
            estimatedFare: 600
        }
    ])

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
                        <Gavel className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{disputes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Refunds Processed</CardTitle>
                        <IndianRupee className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹ 1,450</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                {disputes.map((dispute) => (
                    <Card key={dispute.id} className="overflow-hidden border-l-4 border-l-orange-500">
                        <div className="flex flex-col md:flex-row">
                            <div className="p-4 md:w-1/3 bg-muted/20 border-r space-y-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="font-mono">{dispute.id}</Badge>
                                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">Action Required</Badge>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground block text-xs">User</span>
                                    <span className="font-medium">{dispute.userName}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground block text-xs">Driver</span>
                                    <span className="font-medium">{dispute.driverName}</span>
                                </div>
                            </div>

                            <div className="p-4 md:w-1/3 border-r space-y-4">
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">Dispute Reason</span>
                                    <p className="text-sm font-medium">{dispute.issue}</p>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Map className="w-4 h-4 mr-2 text-blue-500" /> Review Map Trace
                                    </Button>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" /> Read Chat
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 md:w-1/3 bg-muted/10 space-y-4 flex flex-col justify-center">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Original Fare (Charged):</span>
                                    <span className="font-semibold text-red-600">₹ {dispute.fare}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">System Estimate:</span>
                                    <span className="font-semibold text-emerald-600">₹ {dispute.estimatedFare}</span>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <Label className="whitespace-nowrap text-xs">Partial Refund:</Label>
                                    <Input type="number" placeholder="Amt" className="h-8" />
                                    <Button size="sm" className="h-8 bg-black shrink-0">
                                        <IndianRupee className="w-3 h-3 mr-1" /> Issue
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
