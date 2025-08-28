"use client"

import { useState } from "react"
import { QuestionCard } from "@/components/question-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  sampleOnePrepMCQ, 
  sampleOnePrepSPR, 
  sampleBlueBookChoice, 
  sampleBlueBookWrite,
  sampleBlueBookMath 
} from "@/lib/sample-questions"

export default function DemoPage() {
  const [results, setResults] = useState<Record<string, { answer: any, isCorrect: boolean }>>({})

  const handleAnswer = (questionId: string, answer: any, isCorrect: boolean) => {
    setResults(prev => ({
      ...prev,
      [questionId]: { answer, isCorrect }
    }))
  }

  const handleReset = (questionId: string) => {
    setResults(prev => {
      const newResults = { ...prev }
      delete newResults[questionId]
      return newResults
    })
  }

  const getResultBadge = (questionId: string) => {
    const result = results[questionId]
    if (!result) return null
    
    return (
      <Badge variant={result.isCorrect ? "default" : "destructive"} className="ml-2">
        {result.isCorrect ? "✓ Correct" : "✗ Incorrect"}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Question Card Components Demo</h1>
          <p className="text-muted-foreground">
            Showcasing both OnePrep and BlueBook question formats with consistent UX/UI
          </p>
        </div>

        <Tabs defaultValue="oneprep" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="oneprep">OnePrep Format</TabsTrigger>
            <TabsTrigger value="bluebook">BlueBook Format</TabsTrigger>
          </TabsList>

          <TabsContent value="oneprep" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  OnePrep Multiple Choice Question
                  {getResultBadge("oneprep-mcq")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionCard
                  data={sampleOnePrepMCQ}
                  format="oneprep"
                  showExplanation={false}
                  onAnswer={(answer, isCorrect) => handleAnswer("oneprep-mcq", answer, isCorrect)}
                  onReset={() => handleReset("oneprep-mcq")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  OnePrep Student Produced Response (SPR)
                  {getResultBadge("oneprep-spr")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionCard
                  data={sampleOnePrepSPR}
                  format="oneprep"
                  showExplanation={false}
                  onAnswer={(answer, isCorrect) => handleAnswer("oneprep-spr", answer, isCorrect)}
                  onReset={() => handleReset("oneprep-spr")}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bluebook" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  BlueBook Multiple Choice Question
                  {getResultBadge("bluebook-choice")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionCard
                  data={sampleBlueBookChoice}
                  format="bluebook"
                  showExplanation={false}
                  onAnswer={(answer, isCorrect) => handleAnswer("bluebook-choice", answer, isCorrect)}
                  onReset={() => handleReset("bluebook-choice")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  BlueBook Write-in Question
                  {getResultBadge("bluebook-write")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionCard
                  data={sampleBlueBookWrite}
                  format="bluebook"
                  showExplanation={false}
                  onAnswer={(answer, isCorrect) => handleAnswer("bluebook-write", answer, isCorrect)}
                  onReset={() => handleReset("bluebook-write")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  BlueBook Math Question (with LaTeX)
                  {getResultBadge("bluebook-math")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionCard
                  data={sampleBlueBookMath}
                  format="bluebook"
                  showExplanation={false}
                  onAnswer={(answer, isCorrect) => handleAnswer("bluebook-math", answer, isCorrect)}
                  onReset={() => handleReset("bluebook-math")}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results Summary */}
        {Object.keys(results).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(results).map(([questionId, result]) => (
                  <div 
                    key={questionId}
                    className={`p-3 rounded-lg border ${
                      result.isCorrect 
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">
                      {questionId.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Answer: {typeof result.answer === "object" ? result.answer.text || result.answer.letter : result.answer}
                    </div>
                    <Badge 
                      variant={result.isCorrect ? "default" : "destructive"} 
                      className="text-xs mt-1"
                    >
                      {result.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setResults({})}
              >
                Clear All Results
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Technical Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Technical Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">OnePrep Format Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Rich HTML explanations</li>
                  <li>• Multiple choice (MCQ) and Student Produced Response (SPR)</li>
                  <li>• Question review flags</li>
                  <li>• Watermark removal</li>
                  <li>• Multiple answer format support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">BlueBook Format Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• LaTeX/MathQuill math rendering</li>
                  <li>• Image support with error handling</li>
                  <li>• Choice and write-in questions</li>
                  <li>• Clean mathematical notation</li>
                  <li>• Responsive image display</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Shared Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1 columns-2">
                <li>• Consistent UI/UX design</li>
                <li>• Dark mode support</li>
                <li>• Accessibility features</li>
                <li>• Answer validation</li>
                <li>• Try again functionality</li>
                <li>• Result tracking</li>
                <li>• Responsive design</li>
                <li>• TypeScript support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
