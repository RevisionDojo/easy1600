import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Clock, Target, Trophy } from "lucide-react"

export default function OfficialExamsPage() {
  const practiceTests = [
    {
      id: "pt-1",
      title: "Official Practice Test 1",
      difficulty: "Beginner",
      duration: "3 hours",
      sections: 4,
      questions: 154,
      description: "Perfect starting point for SAT preparation",
    },
    {
      id: "pt-2",
      title: "Official Practice Test 2",
      difficulty: "Intermediate",
      duration: "3 hours",
      sections: 4,
      questions: 154,
      description: "Build on foundational skills",
    },
    {
      id: "pt-3",
      title: "Official Practice Test 3",
      difficulty: "Intermediate",
      duration: "3 hours",
      sections: 4,
      questions: 154,
      description: "Continue skill development",
    },
    {
      id: "pt-4",
      title: "Official Practice Test 4",
      difficulty: "Advanced",
      duration: "3 hours",
      sections: 4,
      questions: 154,
      description: "Challenge yourself with harder questions",
    },
    {
      id: "pt-5",
      title: "Official Practice Test 5",
      difficulty: "Advanced",
      duration: "3 hours",
      sections: 4,
      questions: 154,
      description: "Master advanced SAT concepts",
    },
    {
      id: "pt-6",
      title: "Official Practice Test 6",
      difficulty: "Expert",
      duration: "3 hours",
      sections: 4,
      questions: 154,
      description: "Final preparation for test day",
    },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-orange-100 text-orange-800"
      case "Expert":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">OFFICIAL PRACTICE TESTS</h1>
          <p className="text-xl text-muted-foreground mb-6">Complete full-length SAT practice examinations</p>
          <Badge variant="default" className="text-lg px-4 py-2">
            ALL 6 TESTS FREE
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {practiceTests.map((test) => (
            <Card key={test.id} className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  <Badge className={getDifficultyColor(test.difficulty)}>{test.difficulty}</Badge>
                </div>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{test.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span>{test.questions} questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{test.sections} sections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span>Official</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    Start Practice Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
