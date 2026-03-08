import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, Save, Plus, Trash2, PlaneTakeoff } from "lucide-react"

export function TollsTaxesPanel() {
    const [tolls, setTolls] = useState([
        { id: 1, name: "International Airport Pickup", amount: 150, type: "fixed" },
        { id: 2, name: "City Toll (MCD)", amount: 100, type: "fixed" }
    ])

    const [taxes, setTaxes] = useState({
        gst: 5,
        serviceCharge: 2
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-medium">Tolls, Airport & Taxes</h3>
                    <p className="text-sm text-muted-foreground">Manage automatic surcharges applied to specific routes and global tax rates.</p>
                </div>
                <Button>
                    <Save className="h-4 w-4 mr-2" />
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
                                    <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 mt-2">
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        <Card className="border-dashed flex flex-col items-center justify-center p-6 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors cursor-pointer min-h-[200px]">
                            <Plus className="h-8 w-8 mb-2" />
                            <span className="font-medium">Add New Surcharge</span>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
