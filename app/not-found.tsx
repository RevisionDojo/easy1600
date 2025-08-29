import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <div className="flex-1 flex items-center justify-center py-12">
                <div className="container mx-auto px-4">
                    <Card className="max-w-md mx-auto">
                        <CardHeader className="text-center">
                            <CardTitle className="text-6xl mb-4">404</CardTitle>
                            <h1 className="text-2xl font-bold">Page Not Found</h1>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                The page you're looking for doesn't exist or has been moved.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <Link href="/">
                                    <Button className="w-full sm:w-auto">
                                        <Home className="h-4 w-4 mr-2" />
                                        Go Home
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className="w-full sm:w-auto"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Go Back
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    )
}
