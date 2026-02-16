"use client"

import { useState, useEffect } from "react"
import { useRates, RatesData, RateConfig } from "@/features/config/hooks/useRates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
// import { toast } from "sonner" // Removed, using alert for now

const vehicleTypes = [
    { key: 'bike', label: 'Bike Taxi' },
    { key: 'auto', label: 'Auto Rickshaw' },
    { key: 'erickshaw', label: 'E-Rickshaw' },
    { key: 'car', label: 'Car / Mini' },
    { key: 'bigcar', label: 'SUV / XL' },
    { key: 'carriertruck', label: 'Truck / Carrier' },
]

export default function PricingPage() {
    const { rates, loading, updateRates } = useRates()
    const [localRates, setLocalRates] = useState<RatesData | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (rates) {
            setLocalRates(rates)
        }
    }, [rates])

    const handleRateChange = (vehicleKey: string, field: keyof RateConfig, value: string) => {
        if (!localRates) return;
        setLocalRates(prev => ({
            ...prev!,
            [vehicleKey]: {
                ...(prev![vehicleKey] as RateConfig),
                [field]: parseFloat(value) || 0
            }
        }))
    }

    const handleCommissionChange = (value: string) => {
        if (!localRates) return;
        setLocalRates(prev => ({
            ...prev!,
            commission_percent: parseFloat(value) || 0
        }))
    }

    const saveChanges = async () => {
        if (!localRates) return;
        setSaving(true)
        try {
            await updateRates(localRates)
            alert("Pricing updated successfully!")
        } catch (error) {
            alert("Failed to update pricing")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    if (!localRates && !loading) {
        // Initialize with default structure if null
        // Normally handled by hook or backend, but for MVP UI:
        return (
            <div className="p-8">
                <Button onClick={() => updateRates({
                    commission_percent: 20,
                    bike: { base_fare: 40, per_km: 9, night_charge: 10 },
                    auto: { base_fare: 80, per_km: 16, night_charge: 20 },
                    car: { base_fare: 150, per_km: 25, night_charge: 40 },
                    erickshaw: { base_fare: 60, per_km: 13, night_charge: 15 },
                    bigcar: { base_fare: 200, per_km: 30, night_charge: 50 },
                    carriertruck: { base_fare: 250, per_km: 40, night_charge: 60 },
                } as any)}>Initialize Pricing Config</Button>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pricing & Rates</h2>
                    <p className="text-muted-foreground">
                        Manage base fares and per-km rates for all vehicle types.
                    </p>
                </div>
                <Button onClick={saveChanges} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Platform Commission</CardTitle>
                    <CardDescription>Percentage taken by Rurboo from each ride.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 max-w-sm">
                        <Label>Commission (%)</Label>
                        <Input
                            type="number"
                            value={localRates?.commission_percent || 0}
                            onChange={(e) => handleCommissionChange(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicleTypes.map((vehicle) => {
                    const config = (localRates?.[vehicle.key] as RateConfig) || { base_fare: 0, per_km: 0, night_charge: 0 };
                    return (
                        <Card key={vehicle.key}>
                            <CardHeader>
                                <CardTitle className="text-lg">{vehicle.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor={`${vehicle.key}-base`}>Base Fare (₹)</Label>
                                    <Input
                                        id={`${vehicle.key}-base`}
                                        type="number"
                                        value={config.base_fare}
                                        onChange={(e) => handleRateChange(vehicle.key, 'base_fare', e.target.value)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor={`${vehicle.key}-km`}>Per KM Rate (₹)</Label>
                                    <Input
                                        id={`${vehicle.key}-km`}
                                        type="number"
                                        value={config.per_km}
                                        onChange={(e) => handleRateChange(vehicle.key, 'per_km', e.target.value)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor={`${vehicle.key}-night`}>Night Charge (₹)</Label>
                                    <Input
                                        id={`${vehicle.key}-night`}
                                        type="number"
                                        value={config.night_charge}
                                        onChange={(e) => handleRateChange(vehicle.key, 'night_charge', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
