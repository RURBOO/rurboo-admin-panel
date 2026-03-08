import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MapPin, TrendingUp, Save, Plus, Trash2, Loader2 } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

export function SurgePricingPanel() {
    const [surgeActive, setSurgeActive] = useState(false)
    const [zones, setZones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docSnap = await getDoc(doc(db, "configs", "surge_pricing"))
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    setSurgeActive(data.surgeActive || false)
                    if (data.zones) setZones(data.zones)
                }
            } catch (error) {
                console.error("Error fetching surge configs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await setDoc(doc(db, "configs", "surge_pricing"), {
                surgeActive,
                zones
            }, { merge: true })
            toast.success("Surge rules updated successfully on live network!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to push surge configuration to clients.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-medium">Dynamic Surge Configurations</h3>
                    <p className="text-sm text-muted-foreground">Apply multipliers to specific zones during peak hours or high demand.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 bg-secondary/50 p-2 rounded-lg border">
                        <Label htmlFor="global-surge" className="cursor-pointer">Enable Global Surge</Label>
                        <Switch id="global-surge" checked={surgeActive} onCheckedChange={setSurgeActive} />
                    </div>
                    <Button onClick={handleSave} disabled={loading || saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Rules
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zones.map((zone, idx) => (
                    <Card key={zone.id} className={zone.active ? "border-indigo-500 shadow-sm" : "opacity-75"}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                                        {zone.name}
                                    </CardTitle>
                                    <CardDescription>Zone Multiplier Active</CardDescription>
                                </div>
                                <Switch checked={zone.active} onCheckedChange={(val) => {
                                    const newZones = [...zones];
                                    newZones[idx].active = val;
                                    setZones(newZones);
                                }} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="grid w-full items-center gap-1.5 mb-4">
                                <Label>Zone Boundary Name</Label>
                                <Input value={zone.name} onChange={(e) => {
                                    const newZones = [...zones];
                                    newZones[idx].name = e.target.value;
                                    setZones(newZones);
                                }} />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <Label>Fare Multiplier (e.g., 1.5x)</Label>
                                <Input type="number" step="0.1" value={zone.multiplier} onChange={(e) => {
                                    const newZones = [...zones];
                                    newZones[idx].multiplier = parseFloat(e.target.value);
                                    setZones(newZones);
                                }} />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <Label>Radius (km)</Label>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <Input type="number" value={zone.radiusKm} onChange={(e) => {
                                        const newZones = [...zones];
                                        newZones[idx].radiusKm = parseFloat(e.target.value);
                                        setZones(newZones);
                                    }} />
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setZones(zones.filter((_, i) => i !== idx))}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Remove Zone
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                <Card
                    className="border-dashed flex flex-col items-center justify-center p-6 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors cursor-pointer min-h-[250px]"
                    onClick={() => setZones([...zones, { id: Date.now(), name: "New Custom Area", multiplier: 1.2, radiusKm: 3, active: false }])}
                >
                    <Plus className="h-8 w-8 mb-2" />
                    <span className="font-medium">Define New Surge Zone</span>
                    <span className="text-xs text-center mt-2 max-w-[200px]">Draw a polygon on the map or set a radius around a coordinate.</span>
                </Card>
            </div>
        </div>
    )
}
