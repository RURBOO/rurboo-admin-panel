import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
            <div className="bg-muted p-6 rounded-full">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Page Not Found</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    The page you are looking for does not exist or has been moved.
                </p>
            </div>
            <Button asChild>
                <Link href="/dashboard">Return Home</Link>
            </Button>
        </div>
    )
}
