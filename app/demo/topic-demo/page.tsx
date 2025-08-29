"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { TopicSelector, CompactTopicSelector, TopicFilters } from "@/components/topic-selector"
import { TopicAnalytics, TopicBreadcrumb } from "@/components/topic-analytics"
import { BookOpen, Target, BarChart3, Lightbulb } from "lucide-react"
import { TopicMappingService, COLLEGE_BOARD_MAPPING, PRINCETON_TOPICS } from "@/lib/topic-mapping"

export default function TopicDemoPage() {
    const [princetonFilters, setPrincetonFilters] = useState<TopicFilters>({
        subjects: [],
        topics: [],
        subtopics: []
    })
    const [collegeBoardFilters, setCollegeBoardFilters] = useState<TopicFilters>({
        subjects: [],
        topics: [],
        subtopics: []
    })

    return (
        <div className="min-h-screen bg-background">
            <Navigation />

            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">TOPIC SYSTEM DEMO</h1>
                    <p className="text-xl text-muted-foreground mb-6">
                        Comprehensive topic classification and analytics for SAT questions
                    </p>
                    <Badge variant="default" className="text-lg px-4 py-2">
                        HIERARCHICAL TOPIC FILTERING
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Feature Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5" />
                                Topic System Features
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold">✅ Princeton Review Classification:</h4>
                                <p className="text-sm text-muted-foreground">
                                    3-tier hierarchy: Section → Domain → Skill (e.g., Math → Algebra → Linear Solving)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold">✅ College Board Mapping:</h4>
                                <p className="text-sm text-muted-foreground">
                                    Converts codes to readable names (e.g., CAS+WIC → "Command of Authorial Style → Words in Context")
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold">✅ Interactive Analytics:</h4>
                                <p className="text-sm text-muted-foreground">
                                    Bar charts, pie charts, and distribution analysis by topic
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold">✅ Advanced Filtering:</h4>
                                <p className="text-sm text-muted-foreground">
                                    Hierarchical topic selection with cascading filters
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Topic Mapping Examples */}
                    <Card>
                        <CardHeader>
                            <CardTitle>College Board Code Mapping Examples</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Badge variant="outline">en + CAS + WIC</Badge>
                                <p className="text-sm">
                                    → English → Command of Authorial Style → Words in Context
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Badge variant="outline">math + Q + Q.A.</Badge>
                                <p className="text-sm">
                                    → Math → Algebra → Linear Equations in One Variable
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Badge variant="outline">en + INI + INF</Badge>
                                <p className="text-sm">
                                    → English → Information and Ideas → Inferences
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="princeton" className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                        <TabsTrigger value="princeton">Princeton Review</TabsTrigger>
                        <TabsTrigger value="collegeboard">College Board</TabsTrigger>
                    </TabsList>

                    <TabsContent value="princeton" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TopicSelector
                                source="princeton"
                                filters={princetonFilters}
                                onFiltersChange={setPrincetonFilters}
                            />

                            <Card>
                                <CardHeader>
                                    <CardTitle>Selected Princeton Filters</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Subjects ({princetonFilters.subjects.length}):</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {princetonFilters.subjects.map(subject => (
                                                    <Badge key={subject} variant="default">{subject}</Badge>
                                                ))}
                                                {princetonFilters.subjects.length === 0 && (
                                                    <span className="text-muted-foreground text-sm">None selected</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Topics ({princetonFilters.topics.length}):</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {princetonFilters.topics.map(topic => (
                                                    <Badge key={topic} variant="secondary">{topic}</Badge>
                                                ))}
                                                {princetonFilters.topics.length === 0 && (
                                                    <span className="text-muted-foreground text-sm">None selected</span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Subtopics ({princetonFilters.subtopics.length}):</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {princetonFilters.subtopics.map(subtopic => (
                                                    <Badge key={subtopic} variant="outline">{subtopic}</Badge>
                                                ))}
                                                {princetonFilters.subtopics.length === 0 && (
                                                    <span className="text-muted-foreground text-sm">None selected</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <TopicAnalytics source="princeton" />
                    </TabsContent>

                    <TabsContent value="collegeboard" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TopicSelector
                                source="collegeboard"
                                filters={collegeBoardFilters}
                                onFiltersChange={setCollegeBoardFilters}
                            />

                            <Card>
                                <CardHeader>
                                    <CardTitle>College Board Topic Mapping</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Example Mappings:</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono">CAS + WIC</Badge>
                                                    <span>→</span>
                                                    <TopicBreadcrumb
                                                        subject="English"
                                                        topic="Command of Authorial Style"
                                                        subtopic="Words in Context"
                                                        source="collegeboard"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono">Q + Q.A.</Badge>
                                                    <span>→</span>
                                                    <TopicBreadcrumb
                                                        subject="Math"
                                                        topic="Algebra"
                                                        subtopic="Linear Equations in One Variable"
                                                        source="collegeboard"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono">H + H.C.</Badge>
                                                    <span>→</span>
                                                    <TopicBreadcrumb
                                                        subject="Math"
                                                        topic="Geometry and Trigonometry"
                                                        subtopic="Right Triangles and Trigonometry"
                                                        source="collegeboard"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <TopicAnalytics source="collegeboard" />
                    </TabsContent>
                </Tabs>

                {/* Implementation Summary */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>🎯 Implementation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary mb-2">4</div>
                                <div className="text-sm text-muted-foreground">Data Sources</div>
                                <div className="text-xs mt-1">Official Practice, Princeton, College Board, Bluebook</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary mb-2">50+</div>
                                <div className="text-sm text-muted-foreground">Topic Categories</div>
                                <div className="text-xs mt-1">Hierarchical classification system</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary mb-2">19K+</div>
                                <div className="text-sm text-muted-foreground">Questions</div>
                                <div className="text-xs mt-1">All with topic classification</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary mb-2">100%</div>
                                <div className="text-sm text-muted-foreground">Coverage</div>
                                <div className="text-xs mt-1">Every question categorized</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    )
}
