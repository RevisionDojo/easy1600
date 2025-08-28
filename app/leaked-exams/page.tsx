import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Download, Eye } from "lucide-react"

export default function LeakedExamsPage() {
  const leakedExams = [
    {
      id: "aug-2025",
      title: "Official August 2025 SAT",
      date: "August 2025",
      questions: 154,
      sections: ["Reading & Writing", "Math"],
      status: "Latest",
      description: "Most recent official SAT exam with all questions",
    },
    {
      id: "may-2025",
      title: "May 2025 SAT (Leaked)",
      date: "May 2025",
      questions: 154,
      sections: ["Reading & Writing", "Math"],
      status: "Leaked",
      description: "Complete leaked exam from May 2025",
    },
    {
      id: "march-2025",
      title: "March 2025 SAT (Leaked)",
      date: "March 2025",
      questions: 154,
      sections: ["Reading & Writing", "Math"],
      status: "Leaked",
      description: "Full March 2025 leaked examination",
    },
    {
      id: "dec-2024",
      title: "December 2024 SAT (Leaked)",
      date: "December 2024",
      questions: 154,
      sections: ["Reading & Writing", "Math"],
      status: "Leaked",
      description: "Complete December 2024 leaked exam",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">LEAKED SAT EXAMS</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Complete collection of leaked and official SAT examinations
          </p>
          <Badge variant="default" className="text-lg px-4 py-2">
            100% FREE ACCESS
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {leakedExams.map((exam) => (
            <Card key={exam.id} className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{exam.title}</CardTitle>
                  <Badge variant={exam.status === "Latest" ? "default" : "secondary"}>{exam.status}</Badge>
                </div>
                <CardDescription>{exam.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {exam.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {exam.questions} questions
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {exam.sections.map((section) => (
                      <Badge key={section} variant="outline" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Take Exam
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
