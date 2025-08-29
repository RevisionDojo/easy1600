"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { BookOpen, Target, TrendingUp, Award, BarChart3, PieChart as PieChartIcon } from "lucide-react"
import { SATDataService } from "@/lib/data-service"
import { TopicMappingService } from "@/lib/topic-mapping"

interface TopicStats {
    topic: string
    subtopic?: string
    totalQuestions: number
    mcqQuestions: number
    sprQuestions: number
    difficultyBreakdown: Record<string, number>
}

interface TopicAnalyticsProps {
    source: 'princeton' | 'collegeboard' | 'official_practice' | 'bluebook'
    className?: string
}

export function TopicAnalytics({ source, className }: TopicAnalyticsProps) {
    const [stats, setStats] = useState<TopicStats[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'chart' | 'pie'>('chart')

    useEffect(() => {
        loadTopicStats()
    }, [source])

    const loadTopicStats = async () => {
        setLoading(true)

        try {
            let response

            switch (source) {
                case 'princeton':
                    response = await SATDataService.getPrincetonQuestions({ limit: 10000 })
                    break
                case 'collegeboard':
                    response = await SATDataService.getCollegeBoardQuestions({ limit: 10000 })
                    break
                case 'official_practice':
                    response = await SATDataService.getOfficialPracticeQuestions({ limit: 10000 })
                    break
                case 'bluebook':
                    response = await SATDataService.getBluebookQuestions({ limit: 10000 })
                    break
            }

            if (response?.data) {
                const topicStats = analyzeTopicDistribution(response.data, source)
                setStats(topicStats)
            }
        } catch (error) {
            console.error('Failed to load topic stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const analyzeTopicDistribution = (questions: any[], source: string): TopicStats[] => {
        const statsMap: Record<string, TopicStats> = {}

        questions.forEach(question => {
            let topicKey = ''
            let topicName = ''
            let subtopicName = ''

            switch (source) {
                case 'princeton':
                    if (question.meta?.domain && question.meta?.skill) {
                        topicKey = `${question.meta.domain}-${question.meta.skill}`
                        topicName = question.meta.domain
                        subtopicName = question.meta.skill
                    }
                    break

                case 'collegeboard':
                    if (question.primary_class && question.skill) {
                        const topicInfo = TopicMappingService.getCollegeBoardTopic(
                            question.module,
                            question.primary_class,
                            question.skill
                        )
                        if (topicInfo) {
                            topicKey = `${topicInfo.topic}-${topicInfo.subtopic}`
                            topicName = topicInfo.topic
                            subtopicName = topicInfo.subtopic
                        }
                    }
                    break

                case 'official_practice':
                    topicKey = question.subject || 'unknown'
                    topicName = question.subject || 'Unknown'
                    break

                case 'bluebook':
                    topicKey = question.subject || 'unknown'
                    topicName = question.subject || 'Unknown'
                    break
            }

            if (!topicKey) return

            if (!statsMap[topicKey]) {
                statsMap[topicKey] = {
                    topic: topicName,
                    subtopic: subtopicName || undefined,
                    totalQuestions: 0,
                    mcqQuestions: 0,
                    sprQuestions: 0,
                    difficultyBreakdown: {}
                }
            }

            const stat = statsMap[topicKey]
            stat.totalQuestions++

            // Count by answer type
            const answerType = question.answer_type || question.question_type
            if (answerType === 'mcq' || answerType === 'choice') {
                stat.mcqQuestions++
            } else if (answerType === 'spr' || answerType === 'write') {
                stat.sprQuestions++
            }

            // Count by difficulty
            const difficulty = question.difficulty || 'Unknown'
            stat.difficultyBreakdown[difficulty] = (stat.difficultyBreakdown[difficulty] || 0) + 1
        })

        return Object.values(statsMap).sort((a, b) => b.totalQuestions - a.totalQuestions)
    }

    const chartData = stats.map(stat => ({
        name: stat.subtopic || stat.topic,
        total: stat.totalQuestions,
        mcq: stat.mcqQuestions,
        spr: stat.sprQuestions
    }))

    const pieData = stats.map((stat, index) => ({
        name: stat.subtopic || stat.topic,
        value: stat.totalQuestions,
        fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    }))

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Loading analytics...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Topic Distribution
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'chart' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('chart')}
                        >
                            <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'pie' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('pie')}
                        >
                            <PieChartIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {viewMode === 'chart' ? (
                    <div className="space-y-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    fontSize={12}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="mcq" stackId="a" fill="#0088FE" name="Multiple Choice" />
                                <Bar dataKey="spr" stackId="a" fill="#00C49F" name="Student Response" />
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Top Topics List */}
                        <div className="space-y-2">
                            <h4 className="font-semibold">Top Topics by Question Count:</h4>
                            {stats.slice(0, 5).map((stat, index) => (
                                <div key={stat.topic + stat.subtopic} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                                            {index + 1}
                                        </Badge>
                                        <div>
                                            <div className="font-medium">{stat.subtopic || stat.topic}</div>
                                            {stat.subtopic && (
                                                <div className="text-xs text-muted-foreground">{stat.topic}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{stat.totalQuestions}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {stat.mcqQuestions} MCQ • {stat.sprQuestions} SPR
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {stats.length}
                                </div>
                                <div className="text-sm text-muted-foreground">Topics</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {stats.reduce((sum, stat) => sum + stat.totalQuestions, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Questions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {stats.reduce((sum, stat) => sum + stat.mcqQuestions, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">MCQ</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {stats.reduce((sum, stat) => sum + stat.sprQuestions, 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">SPR</div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Topic breadcrumb component
export function TopicBreadcrumb({
    subject,
    topic,
    subtopic,
    source
}: {
    subject?: string
    topic?: string
    subtopic?: string
    source: string
}) {
    if (!subject && !topic && !subtopic) return null

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            {subject && <Badge variant="outline">{subject}</Badge>}
            {topic && <span>→</span>}
            {topic && <Badge variant="outline">{topic}</Badge>}
            {subtopic && <span>→</span>}
            {subtopic && <Badge variant="secondary">{subtopic}</Badge>}
        </div>
    )
}
