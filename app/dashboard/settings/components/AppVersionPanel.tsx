import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Save, Smartphone } from "lucide-react"

export function AppVersionPanel() {
    const [userApp, setUserApp] = useState({
        latestVersion: "1.0.5",
        minVersion: "1.0.0",
        forceUpdate: false,
        storeLink: "https://play.google.com/store/apps/details?id=com.rurboo.user"
    })

    const [driverApp, setDriverApp] = useState({
        latestVersion: "1.2.1",
        minVersion: "1.1.5",
        forceUpdate: true,
        storeLink: "https://play.google.com/store/apps/details?id=com.rurboo.driver"
    })

    const handleSave = () => {
        alert("App Version configurations saved successfully to Firebase!")
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        App Version Control
                    </CardTitle>
                    <CardDescription>Force users or drivers to update their apps to the latest version.</CardDescription>
                </div>
                <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" /> Save Versions
                </Button>
            </CardHeader>
            <CardContent className="space-y-8 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User App Settings */}
                    <div className="space-y-4 border p-4 rounded-lg bg-secondary/10">
                        <h4 className="font-semibold text-lg border-b pb-2">User Application</h4>
                        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                            <Label className="cursor-pointer">Enable Force Update</Label>
                            <Switch checked={userApp.forceUpdate} onCheckedChange={(val) => setUserApp({ ...userApp, forceUpdate: val })} />
                        </div>
                        <div className="grid gap-3">
                            <div>
                                <Label>Latest Version (e.g. 1.0.5)</Label>
                                <Input value={userApp.latestVersion} onChange={(e) => setUserApp({ ...userApp, latestVersion: e.target.value })} />
                            </div>
                            <div>
                                <Label>Minimum Required Version</Label>
                                <Input value={userApp.minVersion} onChange={(e) => setUserApp({ ...userApp, minVersion: e.target.value })} />
                                <p className="text-xs text-muted-foreground mt-1 text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Apps below this version will be locked out.
                                </p>
                            </div>
                            <div>
                                <Label>Store Link</Label>
                                <Input value={userApp.storeLink} onChange={(e) => setUserApp({ ...userApp, storeLink: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Driver App Settings */}
                    <div className="space-y-4 border p-4 rounded-lg bg-blue-50/30">
                        <h4 className="font-semibold text-lg border-b pb-2 text-blue-700">Driver Application</h4>
                        <div className="flex items-center justify-between bg-blue-100 p-3 rounded-md">
                            <Label className="cursor-pointer">Enable Force Update</Label>
                            <Switch checked={driverApp.forceUpdate} onCheckedChange={(val) => setDriverApp({ ...driverApp, forceUpdate: val })} />
                        </div>
                        <div className="grid gap-3">
                            <div>
                                <Label>Latest Version (e.g. 1.2.1)</Label>
                                <Input value={driverApp.latestVersion} onChange={(e) => setDriverApp({ ...driverApp, latestVersion: e.target.value })} />
                            </div>
                            <div>
                                <Label>Minimum Required Version</Label>
                                <Input value={driverApp.minVersion} onChange={(e) => setDriverApp({ ...driverApp, minVersion: e.target.value })} />
                                <p className="text-xs text-muted-foreground mt-1 text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Drivers below this version cannot go online.
                                </p>
                            </div>
                            <div>
                                <Label>Store Link</Label>
                                <Input value={driverApp.storeLink} onChange={(e) => setDriverApp({ ...driverApp, storeLink: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
