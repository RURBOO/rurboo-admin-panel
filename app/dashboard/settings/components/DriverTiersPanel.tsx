import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Star, Target, CheckCircle2 } from "lucide-react"

export function DriverTiersPanel() {
    const [tiers, setTiers] = useState({
        platinum: { rides: 500, rating: 4.8, bonus: 15 },
        gold: { rides: 250, rating: 4.6, bonus: 10 },
        silver: { rides: 100, rating: 4.3, bonus: 5 }
    })

    const handleSave = () => {
        // Here we'd save to Firestore configs/tiers
        // toast.success("Gamification tiers updated successfully!")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Driver Gamification & Tiers
                </CardTitle>
                <CardDescription>
                    Configure requirements and commission bonuses for driver loyalty levels.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">

                    {/* Platinum Tier */}
                    <div className="border rounded-lg p-5 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800" />
                        <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                            Platinum Level
                            <Badge className="bg-slate-800 text-slate-100">Top Tier</Badge>
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Min Lifetime Rides</Label>
                                <Input type="number" value={tiers.platinum.rides} onChange={(e) => setTiers({ ...tiers, platinum: { ...tiers.platinum, rides: Number(e.target.value) } })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Min Rating Threshold</Label>
                                <Input type="number" step="0.1" value={tiers.platinum.rating} onChange={(e) => setTiers({ ...tiers, platinum: { ...tiers.platinum, rating: Number(e.target.value) } })} />
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                                <Label className="text-xs text-muted-foreground">Commission Bonus (%)</Label>
                                <Input type="number" value={tiers.platinum.bonus} onChange={(e) => setTiers({ ...tiers, platinum: { ...tiers.platinum, bonus: Number(e.target.value) } })} className="border-emerald-200 bg-emerald-50 focus-visible:ring-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Gold Tier */}
                    <div className="border rounded-lg p-5 bg-gradient-to-b from-white to-amber-50/30 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                        <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                            Gold Level
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Mid Tier</Badge>
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Min Lifetime Rides</Label>
                                <Input type="number" value={tiers.gold.rides} onChange={(e) => setTiers({ ...tiers, gold: { ...tiers.gold, rides: Number(e.target.value) } })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Min Rating Threshold</Label>
                                <Input type="number" step="0.1" value={tiers.gold.rating} onChange={(e) => setTiers({ ...tiers, gold: { ...tiers.gold, rating: Number(e.target.value) } })} />
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                                <Label className="text-xs text-muted-foreground">Commission Bonus (%)</Label>
                                <Input type="number" value={tiers.gold.bonus} onChange={(e) => setTiers({ ...tiers, gold: { ...tiers.gold, bonus: Number(e.target.value) } })} className="border-emerald-200 bg-emerald-50 focus-visible:ring-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* Silver Tier */}
                    <div className="border rounded-lg p-5 bg-gradient-to-b from-white to-slate-50/50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-400" />
                        <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                            Silver Level
                            <Badge variant="outline" className="text-slate-600">Base Tier</Badge>
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3" /> Min Lifetime Rides</Label>
                                <Input type="number" value={tiers.silver.rides} onChange={(e) => setTiers({ ...tiers, silver: { ...tiers.silver, rides: Number(e.target.value) } })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Min Rating Threshold</Label>
                                <Input type="number" step="0.1" value={tiers.silver.rating} onChange={(e) => setTiers({ ...tiers, silver: { ...tiers.silver, rating: Number(e.target.value) } })} />
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                                <Label className="text-xs text-muted-foreground">Commission Bonus (%)</Label>
                                <Input type="number" value={tiers.silver.bonus} onChange={(e) => setTiers({ ...tiers, silver: { ...tiers.silver, bonus: Number(e.target.value) } })} className="border-emerald-200 bg-emerald-50 focus-visible:ring-emerald-500" />
                            </div>
                        </div>
                    </div>

                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
                <p className="text-sm text-muted-foreground">Bonuses are automatically applied to driver payouts matching these conditions.</p>
                <Button onClick={handleSave} className="gap-2"><CheckCircle2 className="w-4 h-4" /> Save Gamification Rules</Button>
            </CardFooter>
        </Card>
    )
}
