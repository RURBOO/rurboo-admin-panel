import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Clock, FileText, Download, Loader2 } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Driver } from "@/lib/types"

export function KycApprovalPanel({ drivers }: { drivers: Driver[] }) {
    const [processingId, setProcessingId] = useState<string | null>(null)

    const pendingDocs = drivers.flatMap(driver => {
        const docs = [];
        if (driver.profileStatus === 'pending') docs.push({ id: `${driver.id}-profile`, driverId: driver.id, driverName: driver.name || driver.email || 'Unknown', docType: "Profile Photo", submittedAt: "Recent", image: driver.profileImage, field: 'profileStatus' });
        if (driver.licenseStatus === 'pending') docs.push({ id: `${driver.id}-license`, driverId: driver.id, driverName: driver.name || driver.email || 'Unknown', docType: "Driving License", submittedAt: "Recent", image: driver.licenseImage, field: 'licenseStatus' });
        if (driver.rcStatus === 'pending') docs.push({ id: `${driver.id}-rc`, driverId: driver.id, driverName: driver.name || driver.email || 'Unknown', docType: "Vehicle RC", submittedAt: "Recent", image: driver.rcImage, field: 'rcStatus' });
        return docs;
    })

    const handleAction = async (docRef: any, act: 'approved' | 'rejected') => {
        setProcessingId(docRef.id)
        try {
            await updateDoc(doc(db, "drivers", docRef.driverId), {
                [docRef.field]: act
            })
            toast.success(`Document marked as ${act}.`)
        } catch (e) {
            toast.error("Failed to update status")
        } finally {
            setProcessingId(null)
        }
    }

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
                        <div className="text-2xl font-bold">{drivers.filter(d => d.status === 'verified').length}</div>
                        <p className="text-xs text-muted-foreground">Total verified drivers on platform</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
                        <XCircle className="w-4 h-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{drivers.filter(d => Boolean(d.profileStatus === 'rejected' || d.rcStatus === 'rejected' || d.licenseStatus === 'rejected')).length}</div>
                        <p className="text-xs text-muted-foreground">Drivers with rejected documents</p>
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
                                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => doc.image && window.open(doc.image, '_blank')}>
                                            <Download className="w-4 h-4 mr-2" /> View Image
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
                                            disabled={processingId === doc.id}
                                            onClick={() => handleAction(doc, 'approved')}
                                        >
                                            {processingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1 sm:flex-none"
                                            disabled={processingId === doc.id}
                                            onClick={() => handleAction(doc, 'rejected')}
                                        >
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
