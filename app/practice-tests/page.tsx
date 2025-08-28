import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, Target, Users, Play, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

const practiceTests = [
  {
    id: 1,
    title: "Official SAT Practice Test #1",
    source: "College Board",
    sections: ["Reading", "Writing & Language", "Math (No Calculator)", "Math (Calculator)"],
    duration: "3 hours 15 minutes",
    questions: 154,
    difficulty: "Official",
    description: "Complete official SAT practice test from College Board with authentic timing and scoring.",
    isCompleted: false,
  },
  {
    id: 2,
    title: "Princeton Review Diagnostic Test",
    source: "Princeton Review",
    sections: ["Reading", "Writing & Language", "Math"],
    duration: "2 hours 45 minutes",
    questions: 120,
    difficulty: "Diagnostic",
    description: "Comprehensive diagnostic test to identify your strengths and areas for improvement.",
    isCompleted: true,
  },
  {
    id: 3,
    title: "SAT Suite Practice Test A",
    source: "SAT Suite",
    sections: ["Reading", "Writing & Language", "Math"],
    duration: "3 hours",
    questions: 140,
    difficulty: "Official",
    description: "Official practice test from the SAT Suite of Assessments with detailed explanations.",
    isCompleted: false,
  },
]

const quickPractice = [
  {
    title: "Reading Comprehension",
    questions: 25,
    duration: "35 minutes",
    topic: "Reading",
  },
  {
    title: "Writing & Language",
    questions: 20,
    duration: "25 minutes",
    topic: "Writing",
  },
  {
    title: "Math Problem Solving",
    questions: 30,
    duration: "40 minutes",
    topic: "Math",
  },
]

export default function PracticeTestsPage() {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "SAT Suite":
        return <Target className="h-4 w-4" />
      case "Princeton Review":
        return <Users className="h-4 w-4" />
      case "College Board":
        return <BookOpen className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case "SAT Suite":
        return "default"
      case "Princeton Review":
        return "secondary"
      case "College Board":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-balance mb-4">Practice Tests</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl">
            Take full-length practice tests or focus on specific sections to improve your SAT score
          </p>
        </div>

        {/* Quick Practice Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Practice</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickPractice.map((practice, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{practice.title}</CardTitle>
                  <CardDescription>
                    {practice.questions} questions • {practice.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{practice.topic}</Badge>
                    <Link href={`/practice-tests/quick/${practice.topic.toLowerCase()}`}>
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Full Practice Tests */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Full Practice Tests</h2>
          <div className="space-y-6">
            {practiceTests.map((test) => (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSourceColor(test.source)} className="flex items-center gap-1">
                          {getSourceIcon(test.source)}
                          {test.source}
                        </Badge>
                        <Badge variant="outline">{test.difficulty}</Badge>
                        {test.isCompleted && (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{test.title}</CardTitle>
                      <CardDescription className="text-pretty">{test.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {test.duration}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      {test.questions} questions
                    </div>
                    <div className="text-sm text-muted-foreground">{test.sections.length} sections</div>
                    <div className="text-sm text-muted-foreground">Official timing</div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2">Test Sections:</h4>
                    <div className="flex flex-wrap gap-2">
                      {test.sections.map((section, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/practice-tests/${test.id}`}>
                      <Button className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        {test.isCompleted ? "Retake Test" : "Start Test"}
                      </Button>
                    </Link>
                    {test.isCompleted && (
                      <Link href={`/practice-tests/${test.id}/results`}>
                        <Button variant="outline" className="bg-transparent">
                          View Results
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tips Section */}
        <section className="mt-16 bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Test-Taking Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Before You Start</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Find a quiet environment free from distractions</li>
                <li>• Have scratch paper and pencils ready</li>
                <li>• Ensure you have enough time to complete the full test</li>
                <li>• Use a calculator only when permitted</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">During the Test</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Read questions carefully and completely</li>
                <li>• Manage your time effectively across sections</li>
                <li>• Skip difficult questions and return to them later</li>
                <li>• Review your answers if time permits</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
