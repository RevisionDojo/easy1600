"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuestionComponent } from "@/components/question-component"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Search, Filter, BookOpen, Target, Users, ArrowLeft } from "lucide-react"

// Mock data - in real app this would come from API
const mockQuestions = [
  {
    question_id: 2606,
    answer_type: "mcq",
    topic: "Reading",
    subtopic: "Vocabulary in Context",
    difficulty: "Medium",
    source: "SAT Suite",
    stem: "Researchers and conservationists stress that biodiversity loss due to invasive species is ______blank. For example, people can take simple steps such as washing their footwear after travel to avoid introducing potentially invasive organisms into new environments.",
    explanation:
      'Choice A is the best answer because it most logically completes the text\'s discussion of how biodiversity loss due to invasive species can be avoided. As used in this context, "preventable" means able to be stopped or kept from happening.',
    choices: [
      { id: 9141, letter: "A", html: "<p>preventable</p>", text: "preventable", is_correct: true },
      { id: 9142, letter: "B", html: "<p>undeniable</p>", text: "undeniable", is_correct: false },
      { id: 9143, letter: "C", html: "<p>common</p>", text: "common", is_correct: false },
      { id: 9144, letter: "D", html: "<p>concerning</p>", text: "concerning", is_correct: false },
    ],
  },
  {
    question_id: 2607,
    answer_type: "mcq",
    topic: "Math",
    subtopic: "Algebra",
    difficulty: "Hard",
    source: "Princeton Review",
    stem: "If 3x + 2y = 12 and x - y = 1, what is the value of x?",
    explanation:
      "To solve this system of equations, we can use substitution. From the second equation, x = y + 1. Substituting into the first equation: 3(y + 1) + 2y = 12, which gives us 3y + 3 + 2y = 12, so 5y = 9, and y = 9/5. Therefore x = y + 1 = 9/5 + 1 = 14/5.",
    choices: [
      { id: 9145, letter: "A", html: "<p>2</p>", text: "2", is_correct: false },
      { id: 9146, letter: "B", html: "<p>14/5</p>", text: "14/5", is_correct: true },
      { id: 9147, letter: "C", html: "<p>3</p>", text: "3", is_correct: false },
      { id: 9148, letter: "D", html: "<p>9/5</p>", text: "9/5", is_correct: false },
    ],
  },
  {
    question_id: 2608,
    answer_type: "mcq",
    topic: "Writing",
    subtopic: "Grammar",
    difficulty: "Easy",
    source: "College Board",
    stem: "The team of researchers ______blank studying the effects of climate change on coral reefs.",
    explanation: "The subject 'team' is singular, so we need the singular verb form 'is' rather than 'are'.",
    choices: [
      { id: 9149, letter: "A", html: "<p>is</p>", text: "is", is_correct: true },
      { id: 9150, letter: "B", html: "<p>are</p>", text: "are", is_correct: false },
      { id: 9151, letter: "C", html: "<p>were</p>", text: "were", is_correct: false },
      { id: 9152, letter: "D", html: "<p>have been</p>", text: "have been", is_correct: false },
    ],
  },
]

const topics = ["All Topics", "Reading", "Writing", "Math"]
const subtopics = {
  "All Topics": ["All Subtopics"],
  Reading: ["All Subtopics", "Vocabulary in Context", "Main Ideas", "Supporting Details", "Inferences"],
  Writing: ["All Subtopics", "Grammar", "Punctuation", "Style", "Organization"],
  Math: ["All Subtopics", "Algebra", "Geometry", "Statistics", "Advanced Math"],
}
const difficulties = ["All Difficulties", "Easy", "Medium", "Hard"]
const sources = ["All Sources", "SAT Suite", "Princeton Review", "College Board"]

export default function QuestionBankPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("All Topics")
  const [selectedSubtopic, setSelectedSubtopic] = useState("All Subtopics")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All Difficulties")
  const [selectedSource, setSelectedSource] = useState("All Sources")
  const [selectedQuestion, setSelectedQuestion] = useState<(typeof mockQuestions)[0] | null>(null)

  const filteredQuestions = useMemo(() => {
    return mockQuestions.filter((question) => {
      const matchesSearch =
        searchQuery === "" ||
        question.stem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.subtopic.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTopic = selectedTopic === "All Topics" || question.topic === selectedTopic
      const matchesSubtopic = selectedSubtopic === "All Subtopics" || question.subtopic === selectedSubtopic
      const matchesDifficulty = selectedDifficulty === "All Difficulties" || question.difficulty === selectedDifficulty
      const matchesSource = selectedSource === "All Sources" || question.source === selectedSource

      return matchesSearch && matchesTopic && matchesSubtopic && matchesDifficulty && matchesSource
    })
  }, [searchQuery, selectedTopic, selectedSubtopic, selectedDifficulty, selectedSource])

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic)
    setSelectedSubtopic("All Subtopics")
  }

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (selectedQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedQuestion(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Question Bank
              </Button>
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Easy1600</span>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 flex-1">
          <QuestionComponent question={selectedQuestion} showExplanation={true} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-balance mb-4">Question Bank</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl">
            Browse and practice with thousands of SAT questions from official sources
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Questions
            </CardTitle>
            <CardDescription>Find specific questions by topic, difficulty, or search terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions by content, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Topic</label>
                <Select value={selectedTopic} onValueChange={handleTopicChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subtopic</label>
                <Select value={selectedSubtopic} onValueChange={setSelectedSubtopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subtopics[selectedTopic as keyof typeof subtopics]?.map((subtopic) => (
                      <SelectItem key={subtopic} value={subtopic}>
                        {subtopic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Source</label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select defaultValue="newest">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="topic">Topic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to find more questions.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => (
              <Card key={question.question_id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSourceColor(question.source)} className="flex items-center gap-1">
                          {getSourceIcon(question.source)}
                          {question.source}
                        </Badge>
                        <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="secondary">
                          {question.topic} • {question.subtopic}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">Question {question.question_id}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed text-pretty mb-4 line-clamp-3">
                    {question.stem}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{question.choices.length} choices</span>
                      <span>•</span>
                      <span>{question.answer_type.toUpperCase()}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedQuestion(question)}
                      className="bg-transparent"
                      variant="outline"
                    >
                      Try This Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredQuestions.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="bg-transparent">
              Load More Questions
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
