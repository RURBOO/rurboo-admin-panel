import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, FileText, Download } from "lucide-react"

export function KycApprovalPanel() {
    // Mock data for UI demonstration
    const [pendingDocs, setPendingDocs] = useState([
        { id: "KYC-001", driverName: "Ramesh Singh", docType: "Aadhar Card", submittedAt: "2 hours ago", status: "pending" },
        { id: "KYC-002", driverName: "Ali Khan", docType: "Driving License", submittedAt: "3 hours ago", status: "pending" },
        { id: "KYC-003", driverName: "Sunil Verma", docType: "Vehicle RC", submittedAt: "5 hours ago", status: "pending" },
    ])

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingDocs.length}</div>
                        <p className="text-xs text-muted-foreground">Documents awaiting manual review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Drivers successfully onboarded</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
                        <XCircle className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">Missing or blurry documents</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> KYC Review Queue</CardTitle>
                    <CardDescription>Review uploaded documents and approve or reject submissions to activate drivers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pendingDocs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">All caught up! No pending documents.</div>
                        ) : (
                            pendingDocs.map((doc, idx) => (
                                <div key={doc.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                        <div className="bg-primary/10 p-3 rounded-full hidden sm:block">
                                            <FileText className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-base">{doc.driverName}</div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Badge variant="outline">{doc.docType}</Badge>
                                                <span>•</span>
                                                <span>Submitted {doc.submittedAt}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex w-full sm:w-auto items-center gap-2">
                                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                            <Download className="w-4 h-4 mr-2" /> View Image
                                        </Button>
                                        <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none" onClick={() => {
                                            const newDocs = [...pendingDocs];
                                            newDocs.splice(idx, 1);
                                            setPendingDocs(newDocs);
                                        }}>
                                            Approve
                                        </Button>
                                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => {
                                            const newDocs = [...pendingDocs];
                                            newDocs.splice(idx, 1);
                                            setPendingDocs(newDocs);
                                        }}>
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
