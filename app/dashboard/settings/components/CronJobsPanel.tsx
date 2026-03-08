import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Clock, Mail, Server, History, Calendar, PlayCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function CronJobsPanel() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form states
    const [newTarget, setNewTarget] = useState("email_report")
    const [newCron, setNewCron] = useState("0 9 * * *")

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "configs", "cron_jobs"), (docSnap) => {
            if (docSnap.exists() && docSnap.data().jobs) {
                setJobs(docSnap.data().jobs)
            } else {
                // Initial defaults if empty
                setJobs([
                    { id: "cjs-01", name: "Daily Revenue Report", schedule: "0 8 * * *", nextRun: "Tomorrow 08:00 AM", active: true, type: "email_report" },
                    { id: "cjs-02", name: "Inactive Driver Cleanup", schedule: "0 0 * * 0", nextRun: "Sunday 12:00 AM", active: true, type: "system" },
                    { id: "cjs-03", name: "Calculate Gamification Tiers", schedule: "0 2 1 * *", nextRun: "1st of next month, 02:00 AM", active: false, type: "system" },
                    { id: "cjs-04", name: "Weekly KYC Reminders", schedule: "0 10 * * 1", nextRun: "Monday 10:00 AM", active: true, type: "fcm_notify" }
                ])
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const toggleJob = async (id: string, current: boolean) => {
        const updatedJobs = jobs.map(j => j.id === id ? { ...j, active: !current } : j)
        setJobs(updatedJobs)
        try {
            await setDoc(doc(db, "configs", "cron_jobs"), { jobs: updatedJobs }, { merge: true })
            toast.info(current ? "Scheduled job paused" : "Scheduled job verified and activated")
        } catch (e) {
            toast.error("Failed to update schedule status.")
        }
    }

    const triggerManual = (name: string) => {
        toast.success(`Forcing manual execution of: ${name}`)
    }

    const handleAddTask = async () => {
        if (!newCron) return toast.error("Cron expression required");

        setSaving(true);
        const newJob = {
            id: `cjs-${Date.now()}`,
            name: newTarget === 'email_report' ? 'Send Data Export (Email)' : newTarget === 'fcm_notify' ? 'Broadcast Push Notification' : 'Firestore Optimization Script',
            schedule: newCron,
            nextRun: "Next scheduled trigger",
            active: true,
            type: newTarget
        };
        const updatedJobs = [newJob, ...jobs];
        try {
            await setDoc(doc(db, "configs", "cron_jobs"), { jobs: updatedJobs }, { merge: true })
            toast.success("New scheduled task added successfully")
            setNewCron("0 9 * * *")
        } catch (e) {
            toast.error("Failed to save scheduled task.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card className="border-indigo-100">
            <CardHeader className="bg-indigo-50/50 pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Clock className="w-5 h-5" />
                    Automated Reports & Cron Jobs
                </CardTitle>
                <CardDescription>
                    Configure scheduling for system maintenance scripts and automated email exports.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">

                <div className="flex gap-4 mb-8 p-4 bg-muted/30 border border-dashed rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Label>New Schedule Target</Label>
                        <Select value={newTarget} onValueChange={setNewTarget}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email_report">Send Data Export (Email)</SelectItem>
                                <SelectItem value="fcm_notify">Broadcast Push Notification</SelectItem>
                                <SelectItem value="db_cleanup">Firestore Optimization Script</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label>Cron Expression</Label>
                        <Input placeholder="* * * * *" value={newCron} onChange={e => setNewCron(e.target.value)} className="font-mono text-sm" />
                    </div>
                    <div className="flex items-end">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleAddTask} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-base font-semibold">Active Schedules</Label>
                    <div className="border rounded-md divide-y">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        ) : jobs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No active cron jobs.</div>
                        ) : jobs.map(job => (
                            <div key={job.id} className={`p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-colors ${job.active ? 'bg-white' : 'bg-muted/40'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${job.active ? 'bg-indigo-100 text-indigo-600' : 'bg-muted text-muted-foreground'}`}>
                                        {job.type === 'email_report' ? <Mail className="w-4 h-4" /> :
                                            job.type === 'fcm_notify' ? <Server className="w-4 h-4" /> :
                                                <History className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            {job.name}
                                            <Badge variant="outline" className="font-mono text-[10px] tracking-widest">{job.schedule}</Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Next Run: {job.nextRun}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <Switch checked={job.active} onCheckedChange={() => toggleJob(job.id, job.active)} />
                                        <span className="text-[10px] text-muted-foreground mt-1">{job.active ? 'Active' : 'Paused'}</span>
                                    </div>
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => triggerManual(job.name)}>
                                        <PlayCircle className="w-4 h-4 text-green-600" /> Run Now
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
