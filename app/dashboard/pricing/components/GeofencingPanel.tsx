import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Map, Save, Navigation, ShieldCheck, Loader2 } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

export function GeofencingPanel() {
    const [strictMode, setStrictMode] = useState(true)
    const [outstationEnabled, setOutstationEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docSnap = await getDoc(doc(db, "configs", "geofencing"))
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    setStrictMode(data.strictMode ?? true)
                    setOutstationEnabled(data.outstationEnabled ?? false)
                }
            } catch (error) {
                console.error("Error fetching geofence configs", error)
            } finally {
                setLoading(false)
            }
        }
        fetchConfig()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            await setDoc(doc(db, "configs", "geofencing"), {
                strictMode,
                outstationEnabled
            }, { merge: true })
            toast.success("Geofence rules updated across fleet system.")
        } catch (error) {
            console.error(error)
            toast.error("Failed to commit network configurations.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-medium">Geofencing & City Limits</h3>
                    <p className="text-sm text-muted-foreground">Restrict driver ride acceptances to operating zones and manage outstation policies.</p>
                </div>
                <Button onClick={handleSave} disabled={loading || saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Configuration
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-emerald-500" /> City Operating Geofence</CardTitle>
                        <CardDescription>Drivers outside this boundary cannot go online.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="aspect-video w-full bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=28.6139,77.2090&zoom=10&size=600x300&key=dummy')] bg-cover bg-center" />
                            <Button variant="secondary" className="relative shadow-md"><Map className="mr-2 h-4 w-4" /> Draw Polygon Boundary</Button>
                        </div>

                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                                <Label>Strict Geofence Enforcement</Label>
                                <p className="text-xs text-muted-foreground">Automatically log out drivers exiting the polygon.</p>
                            </div>
                            <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-blue-500" /> Outstation / Intercity Trips</CardTitle>
                        <CardDescription>Rules for rides going beyond the standard city geofence.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-lg border">
                            <div className="space-y-0.5">
                                <Label className="text-base">Allow Outstation Rides</Label>
                                <p className="text-xs text-muted-foreground">Enable users to book rides outside the city polygon.</p>
                            </div>
                            <Switch checked={outstationEnabled} onCheckedChange={setOutstationEnabled} />
                        </div>

                        <div className={outstationEnabled ? "space-y-4" : "opacity-50 pointer-events-none space-y-4"}>
                            <h4 className="text-sm font-medium">Outstation Surcharges</h4>
                            <div className="bg-orange-50 text-orange-800 p-3 rounded-md flex items-start gap-2 text-sm border border-orange-200">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Return Fare Rule</p>
                                    <p className="text-xs mt-1">Automatically charges return fare for empty transit if dropping outside the geofence.</p>
                                </div>
                            </div>
                            {/* Further configuration fields would go here */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
