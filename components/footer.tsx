import { Target } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-card py-12 px-4 mt-auto">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Easy1600</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Free SAT preparation with official questions and comprehensive practice tests.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Practice</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/question-bank" className="hover:text-foreground transition-colors">
                  Question Bank
                </Link>
              </li>
              <li>
                <Link href="/practice-tests" className="hover:text-foreground transition-colors">
                  Practice Tests
                </Link>
              </li>
              <li>
                <Link href="/topics" className="hover:text-foreground transition-colors">
                  Topics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors">
                  Help
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Easy1600. All rights reserved. SAT is a trademark of the College Board.</p>
        </div>
      </div>
    </footer>
  )
}
