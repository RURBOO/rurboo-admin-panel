import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, Save, Plus, Trash2, PlaneTakeoff, Loader2 } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

export function TollsTaxesPanel() {
    const [tolls, setTolls] = useState<any[]>([])
    const [taxes, setTaxes] = useState({ gst: 0, serviceCharge: 0 })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docSnap = await getDoc(doc(db, "configs", "pricing_surcharges"))
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    if (data.tolls) setTolls(data.tolls)
                    if (data.taxes) setTaxes(data.taxes)
                }
            } catch (error) {
                console.error("Error fetching pricing configs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await setDoc(doc(db, "configs", "pricing_surcharges"), {
                tolls,
                taxes
            }, { merge: true })
            toast.success("Surcharges and Taxes saved successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save configuration.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-medium">Tolls, Airport & Taxes</h3>
                    <p className="text-sm text-muted-foreground">Manage automatic surcharges applied to specific routes and global tax rates.</p>
                </div>
                <Button onClick={handleSave} disabled={loading || saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Configuration
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="col-span-full md:col-span-1 border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-blue-600" /> Global Tax Rates</CardTitle>
                        <CardDescription>Applied to the subtotal of every completed ride.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label>GST / VAT (%)</Label>
                            <Input type="number" value={taxes.gst} onChange={(e) => setTaxes({ ...taxes, gst: parseFloat(e.target.value) })} />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label>Platform Service Charge (%)</Label>
                            <Input type="number" value={taxes.serviceCharge} onChange={(e) => setTaxes({ ...taxes, serviceCharge: parseFloat(e.target.value) })} />
                        </div>
                    </CardContent>
                </Card>

                <div className="col-span-full md:col-span-1 lg:col-span-2 space-y-4">
                    <h4 className="text-lg font-medium flex items-center gap-2"><PlaneTakeoff className="h-5 w-5" /> Location Surcharges (Airport / Tolls)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tolls.map((toll, idx) => (
                            <Card key={toll.id}>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label>Surcharge Name</Label>
                                        <Input value={toll.name} onChange={(e) => {
                                            const newTolls = [...tolls];
                                            newTolls[idx].name = e.target.value;
                                            setTolls(newTolls);
                                        }} />
                                    </div>
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label>Flat Amount (₹)</Label>
                                        <Input type="number" value={toll.amount} onChange={(e) => {
                                            const newTolls = [...tolls];
                                            newTolls[idx].amount = parseFloat(e.target.value);
                                            setTolls(newTolls);
                                        }} />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 mt-2"
                                        onClick={() => setTolls(tolls.filter((_, i) => i !== idx))}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        <Card
                            className="border-dashed flex flex-col items-center justify-center p-6 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors cursor-pointer min-h-[200px]"
                            onClick={() => setTolls([...tolls, { id: Date.now(), name: "New Surcharge", amount: 0, type: "fixed" }])}
                        >
                            <Plus className="h-8 w-8 mb-2" />
                            <span className="font-medium">Add New Surcharge</span>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
