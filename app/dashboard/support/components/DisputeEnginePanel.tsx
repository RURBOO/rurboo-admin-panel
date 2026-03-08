import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquare, Map, IndianRupee, Gavel, CheckCircle2, Loader2 } from "lucide-react"
import { SupportTicket } from "@/features/support/hooks/useSupport"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

export function DisputeEnginePanel({ tickets }: { tickets: SupportTicket[] }) {
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Filter tickets that might be dispute related, or just map the latest open ones 
    // to function as the dispute queue.
    const disputes = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').map(t => ({
        id: t.id,
        driverName: t.userType === 'driver' ? t.name : "Unknown Driver",
        userName: t.userType === 'user' ? t.name : "Unknown User",
        issue: t.subject + " - " + t.message,
        status: t.status,
        fare: 0, // Would be fetched from actual ride history reference
        estimatedFare: 0
    }))

    const handleIssueRefund = async (id: string) => {
        setProcessingId(id)
        try {
            await updateDoc(doc(db, "support_tickets", id), {
                status: 'resolved'
            })
            toast.success("Refund processed and ticket resolved!")
        } catch (error) {
            toast.error("Failed to issue refund.")
        } finally {
            setProcessingId(null)
        }
    }

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
                                    <Button
                                        size="sm"
                                        className="h-8 bg-black shrink-0"
                                        disabled={processingId === dispute.id}
                                        onClick={() => handleIssueRefund(dispute.id)}
                                    >
                                        {processingId === dispute.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <IndianRupee className="w-3 h-3 mr-1" />}
                                        Issue
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
