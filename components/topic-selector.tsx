"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Target, Filter, X, ChevronDown } from "lucide-react"
import { TopicMappingService, PRINCETON_TOPICS, COLLEGE_BOARD_MAPPING } from "@/lib/topic-mapping"

export interface TopicFilters {
    subjects: string[]
    topics: string[]
    subtopics: string[]
}

interface TopicSelectorProps {
    source: 'princeton' | 'collegeboard' | 'official_practice' | 'bluebook'
    filters: TopicFilters
    onFiltersChange: (filters: TopicFilters) => void
    className?: string
}

export function TopicSelector({ source, filters, onFiltersChange, className }: TopicSelectorProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const topicHierarchy = TopicMappingService.getAllTopics(source)

    const handleSubjectToggle = (subject: string, checked: boolean) => {
        const newSubjects = checked
            ? [...filters.subjects, subject]
            : filters.subjects.filter(s => s !== subject)

        // If unchecking subject, also uncheck all its topics/subtopics
        let newTopics = filters.topics
        let newSubtopics = filters.subtopics

        if (!checked) {
            const subjectData = topicHierarchy.find(h => h.subject === subject)
            if (subjectData) {
                const subjectTopics = subjectData.topics.map(t => t.topic)
                const subjectSubtopics = subjectData.topics.flatMap(t => t.subtopics)
                newTopics = newTopics.filter(t => !subjectTopics.includes(t))
                newSubtopics = newSubtopics.filter(st => !subjectSubtopics.includes(st))
            }
        }

        onFiltersChange({
            subjects: newSubjects,
            topics: newTopics,
            subtopics: newSubtopics
        })
    }

    const handleTopicToggle = (topic: string, subject: string, checked: boolean) => {
        const newTopics = checked
            ? [...filters.topics, topic]
            : filters.topics.filter(t => t !== topic)

        // If unchecking topic, also uncheck all its subtopics
        let newSubtopics = filters.subtopics

        if (!checked) {
            const subjectData = topicHierarchy.find(h => h.subject === subject)
            const topicData = subjectData?.topics.find(t => t.topic === topic)
            if (topicData) {
                newSubtopics = newSubtopics.filter(st => !topicData.subtopics.includes(st))
            }
        }

        onFiltersChange({
            subjects: filters.subjects,
            topics: newTopics,
            subtopics: newSubtopics
        })
    }

    const handleSubtopicToggle = (subtopic: string, checked: boolean) => {
        const newSubtopics = checked
            ? [...filters.subtopics, subtopic]
            : filters.subtopics.filter(st => st !== subtopic)

        onFiltersChange({
            subjects: filters.subjects,
            topics: filters.topics,
            subtopics: newSubtopics
        })
    }

    const clearAllFilters = () => {
        onFiltersChange({
            subjects: [],
            topics: [],
            subtopics: []
        })
    }

    const getFilterCount = () => {
        return filters.subjects.length + filters.topics.length + filters.subtopics.length
    }

    // For sources without detailed classification, show simple subject selector
    if (source === 'official_practice' || source === 'bluebook') {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Subject Filter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={filters.subjects[0] || "All"}
                        onValueChange={(value) => onFiltersChange({
                            subjects: value === "All" ? [] : [value],
                            topics: [],
                            subtopics: []
                        })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Subjects</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Math">Math</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Topic Classification
                        {getFilterCount() > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {getFilterCount()} selected
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex gap-2">
                        {getFilterCount() > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent>
                    <ScrollArea className="h-80">
                        <Accordion type="multiple" className="w-full">
                            {topicHierarchy.map((subjectData) => (
                                <AccordionItem key={subjectData.subject} value={subjectData.subject}>
                                    <AccordionTrigger className="text-left">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`subject-${subjectData.subject}`}
                                                checked={filters.subjects.includes(subjectData.subject)}
                                                onCheckedChange={(checked) => handleSubjectToggle(subjectData.subject, checked as boolean)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <BookOpen className="h-4 w-4" />
                                            <span className="font-semibold">{subjectData.subject}</span>
                                            <Badge variant="outline" className="ml-auto">
                                                {subjectData.topics.length} topics
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pl-6">
                                            {subjectData.topics.map((topicData) => (
                                                <div key={topicData.topic} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`topic-${topicData.topic}`}
                                                            checked={filters.topics.includes(topicData.topic)}
                                                            onCheckedChange={(checked) => handleTopicToggle(topicData.topic, subjectData.subject, checked as boolean)}
                                                        />
                                                        <Label htmlFor={`topic-${topicData.topic}`} className="font-medium">
                                                            {topicData.topic}
                                                        </Label>
                                                        <Badge variant="outline" className="text-xs">
                                                            {topicData.subtopics.length}
                                                        </Badge>
                                                    </div>

                                                    {topicData.subtopics.length > 0 && (
                                                        <div className="grid grid-cols-1 gap-1 pl-6">
                                                            {topicData.subtopics.map((subtopic) => (
                                                                <div key={subtopic} className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        id={`subtopic-${subtopic}`}
                                                                        checked={filters.subtopics.includes(subtopic)}
                                                                        onCheckedChange={(checked) => handleSubtopicToggle(subtopic, checked as boolean)}
                                                                    />
                                                                    <Label htmlFor={`subtopic-${subtopic}`} className="text-sm text-muted-foreground">
                                                                        {subtopic}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </ScrollArea>
                </CardContent>
            )}
        </Card>
    )
}

// Simple topic filter component for mobile/compact views
export function CompactTopicSelector({ source, filters, onFiltersChange }: TopicSelectorProps) {
    const topicHierarchy = TopicMappingService.getAllTopics(source)

    // Get all available options
    const allTopics = topicHierarchy.flatMap(s => s.topics.map(t => t.topic))
    const allSubtopics = topicHierarchy.flatMap(s => s.topics.flatMap(t => t.subtopics))

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subject Selection */}
            <Select
                value={filters.subjects[0] || "All"}
                onValueChange={(value) => onFiltersChange({
                    subjects: value === "All" ? [] : [value],
                    topics: [],
                    subtopics: []
                })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Subjects</SelectItem>
                    {topicHierarchy.map(s => (
                        <SelectItem key={s.subject} value={s.subject}>{s.subject}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Topic Selection */}
            <Select
                value={filters.topics[0] || "All"}
                onValueChange={(value) => onFiltersChange({
                    subjects: filters.subjects,
                    topics: value === "All" ? [] : [value],
                    subtopics: []
                })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Topics</SelectItem>
                    {allTopics.map(topic => (
                        <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Subtopic Selection */}
            <Select
                value={filters.subtopics[0] || "All"}
                onValueChange={(value) => onFiltersChange({
                    subjects: filters.subjects,
                    topics: filters.topics,
                    subtopics: value === "All" ? [] : [value]
                })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Subtopic" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Subtopics</SelectItem>
                    {allSubtopics.map(subtopic => (
                        <SelectItem key={subtopic} value={subtopic}>{subtopic}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
