'use client'

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, BookOpen, DollarSign, Users } from "lucide-react"

export default function PhilosophyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navigation />

            <main className="flex-1 px-4 py-8">
                <div className="container mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <Button variant="ghost" className="mb-4 -ml-4" asChild>
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Link>
                        </Button>

                        <div className="text-center mb-8">
                            <Badge variant="destructive" className="mb-4 text-sm px-4 py-2">
                                EDUCATIONAL MANIFESTO
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-4">
                                Dismantling the
                                <span className="text-primary block">SAT Industrial Complex</span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                                An academic indictment of the College Board's systematic exploitation of educational inequality
                            </p>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="prose prose-lg max-w-none">

                        {/* Introduction */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">The Commodification of Educational Opportunity</h2>
                            <div className="bg-card p-8 rounded-lg border-l-4 border-primary">
                                <p className="text-lg leading-relaxed mb-4">
                                    The College Board operates what Pierre Bourdieu would recognize as a textbook example of <em>cultural capital</em> hoarding—systematically restricting access to the very materials necessary for success on their own examination. This isn't merely corporate greed; it's the institutionalization of educational apartheid.
                                </p>
                                <p className="text-lg leading-relaxed">
                                    As Samuel Bowles and Herbert Gintis demonstrated in <em>Schooling in Capitalist America</em>, standardized testing serves not as a meritocratic sorting mechanism, but as a tool for reproducing existing class hierarchies. The College Board has perfected this function.
                                </p>
                            </div>
                        </section>

                        {/* The Economic Violence */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">The Economics of Educational Violence</h2>

                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg">
                                    <DollarSign className="h-8 w-8 text-destructive mb-3" />
                                    <h3 className="font-bold text-lg mb-2">$99+ per prep book</h3>
                                    <p className="text-sm text-muted-foreground">While withholding thousands of practice questions</p>
                                </div>
                                <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg">
                                    <BookOpen className="h-8 w-8 text-destructive mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Artificial scarcity</h3>
                                    <p className="text-sm text-muted-foreground">Releasing minimal practice materials to maximize profit</p>
                                </div>
                                <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg">
                                    <Users className="h-8 w-8 text-destructive mb-3" />
                                    <h3 className="font-bold text-lg mb-2">Class stratification</h3>
                                    <p className="text-sm text-muted-foreground">Creating deliberate barriers to educational mobility</p>
                                </div>
                            </div>

                            <p className="text-lg leading-relaxed mb-4">
                                The College Board's business model represents what David Harvey calls <em>accumulation by dispossession</em>—the systematic extraction of value from public educational resources. They have taken what should be a public good (educational assessment) and transformed it into a private profit center worth over <strong>$1.2 billion annually</strong>.
                            </p>

                            <p className="text-lg leading-relaxed">
                                This economic violence is most clearly seen in their practice material pricing strategy. While charging students $99 for prep books containing perhaps 8-10 practice tests, the College Board simultaneously hoards thousands of additional questions that could dramatically improve preparation outcomes. This is not market efficiency—it's manufactured scarcity designed to extract maximum revenue from desperate families.
                            </p>
                        </section>

                        <Separator className="my-12" />

                        {/* Academic Critique */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">The Myth of Meritocracy Exposed</h2>

                            <blockquote className="border-l-4 border-primary pl-6 italic text-lg mb-6 bg-muted/50 p-6 rounded-r-lg">
                                "The function of the school system is not to produce cognitive skills, but to legitimate inequality."
                                <footer className="text-sm font-medium mt-2 not-italic">— Samuel Bowles, <em>Schooling in Capitalist America</em></footer>
                            </blockquote>

                            <p className="text-lg leading-relaxed mb-4">
                                The College Board's rhetoric of "college readiness" and "fair assessment" crumbles under academic scrutiny. Research by Rebecca Zwick at UC Santa Barbara demonstrates that SAT scores correlate more strongly with family income than with actual academic ability or college performance. Yet the College Board continues to market their test as an objective measure of merit.
                            </p>

                            <p className="text-lg leading-relaxed mb-4">
                                Joseph Soares's longitudinal study at Wake Forest University found that <strong>SAT scores add virtually no predictive value</strong> for college success beyond what high school GPA already provides. The test exists not to measure ability, but to create the <em>appearance</em> of meritocratic selection while actually reinforcing existing privilege structures.
                            </p>

                            <p className="text-lg leading-relaxed">
                                As Paulo Freire warned in <em>Pedagogy of the Oppressed</em>, standardized testing represents the "banking concept of education"—treating students as empty vessels to be filled with predetermined content rather than critical thinkers capable of transforming their world. The College Board has weaponized this concept for profit.
                            </p>
                        </section>

                        {/* The Hypocrisy Documented */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">Documented Institutional Hypocrisy</h2>

                            <div className="bg-card border-2 border-destructive p-8 rounded-lg mb-6">
                                <h3 className="text-xl font-bold mb-4 text-destructive">The College Board's Own Words vs. Actions</h3>

                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-primary mb-2">They Say:</h4>
                                            <p className="text-sm bg-primary/10 p-4 rounded italic">
                                                "We are committed to promoting equity and excellence in education"
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-destructive mb-2">They Do:</h4>
                                            <p className="text-sm bg-destructive/10 p-4 rounded">
                                                Charge low-income families hundreds of dollars for practice materials while sitting on thousands of free questions
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-primary mb-2">They Say:</h4>
                                            <p className="text-sm bg-primary/10 p-4 rounded italic">
                                                "The SAT measures college readiness"
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-destructive mb-2">They Do:</h4>
                                            <p className="text-sm bg-destructive/10 p-4 rounded">
                                                Create tests that primarily measure socioeconomic status and access to expensive preparation resources
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-lg leading-relaxed mb-4">
                                Former College Board president <strong>Gaston Caperton</strong> earned over $1.3 million annually while claiming to serve educational equity. Current leadership continues this tradition of executive enrichment built on student exploitation. Meanwhile, CEO <strong>David Coleman</strong>—architect of the Common Core—has systematically expanded the College Board's profit-extraction mechanisms while publicly advocating for educational access.
                            </p>

                            <p className="text-lg leading-relaxed">
                                The organization that claims to "connect students to college success" has instead perfected what Michelle Alexander would recognize as a new form of <em>educational redlining</em>—using ostensibly race-neutral policies to maintain racial and economic stratification in higher education access.
                            </p>
                        </section>

                        <Separator className="my-12" />

                        {/* Our Response */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">Praxis: Theory Into Action</h2>

                            <p className="text-lg leading-relaxed mb-4">
                                Following Antonio Gramsci's concept of <em>counter-hegemonic practice</em>, we reject the College Board's manufactured scarcity and artificial gatekeeping. If standardized testing must exist within our current educational system, then <strong>every student must have access to every question</strong> that has ever appeared on these examinations.
                            </p>

                            <div className="bg-primary/10 border-2 border-primary p-8 rounded-lg mb-6">
                                <h3 className="text-2xl font-bold mb-4">Our Radical Transparency Principle</h3>
                                <ul className="space-y-3 text-lg">
                                    <li className="flex items-start">
                                        <span className="text-primary mr-3">•</span>
                                        <span><strong>Complete access:</strong> Every official SAT question from leaked exams, practice tests, and question banks</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-primary mr-3">•</span>
                                        <span><strong>Zero paywalls:</strong> No premium tiers, no artificial limitations, no economic barriers</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-primary mr-3">•</span>
                                        <span><strong>Open methodology:</strong> Transparent aggregation from College Board's own materials, Princeton Review resources, and leaked examinations</span>
                                    </li>
                                </ul>
                            </div>

                            <p className="text-lg leading-relaxed">
                                This represents what Paulo Freire called <em>critical pedagogy</em> in action—education as the practice of freedom rather than the reproduction of oppression. We refuse to participate in the College Board's system of educational apartheid.
                            </p>
                        </section>

                        {/* The Academic Case */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">The Academic Consensus Against Standardized Testing</h2>

                            <p className="text-lg leading-relaxed mb-4">
                                The academic literature is unambiguous: standardized testing as currently implemented serves primarily to reproduce existing inequality rather than measure academic ability. <strong>FairTest</strong> has documented over 1,000 colleges that have abandoned SAT requirements, recognizing the test's fundamental invalidity.
                            </p>

                            <div className="bg-muted p-6 rounded-lg mb-6">
                                <h3 className="font-bold text-lg mb-3">Key Research Findings:</h3>
                                <ul className="space-y-2">
                                    <li><strong>Geiser & Santelices (2007):</strong> SAT scores explain only 4% of variance in college GPA beyond high school performance</li>
                                    <li><strong>Hiss & Franks (2014):</strong> Test-optional policies show no decrease in academic performance among admitted students</li>
                                    <li><strong>Buckley et al. (2018):</strong> SAT prep courses provide minimal score improvements despite enormous costs</li>
                                    <li><strong>Guinier (2015):</strong> Standardized testing functions as "testocracy"—governance by test scores rather than democratic values</li>
                                </ul>
                            </div>

                            <p className="text-lg leading-relaxed">
                                <strong>Lani Guinier</strong> of Harvard Law School argues that the SAT represents a form of "testocracy"—a system where test scores become proxies for worth, masking the reality that these scores primarily reflect access to resources rather than innate ability or potential.
                            </p>
                        </section>

                        {/* The Moral Imperative */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">The Moral Imperative for Educational Justice</h2>

                            <p className="text-lg leading-relaxed mb-4">
                                John Rawls's <em>Theory of Justice</em> provides a framework for evaluating the College Board's practices. Behind the "veil of ignorance," would any rational actor choose a system where educational opportunities depend on family wealth? The College Board's model fails this fundamental test of justice.
                            </p>

                            <p className="text-lg leading-relaxed mb-4">
                                <strong>Jonathan Kozol's</strong> documentation of educational apartheid in <em>Savage Inequalities</em> finds its contemporary expression in the College Board's business model. They have created what amounts to a <em>cognitive poll tax</em>—charging students for access to the materials necessary to succeed on their own examination.
                            </p>

                            <blockquote className="border-l-4 border-destructive pl-6 italic text-lg mb-6 bg-destructive/5 p-6 rounded-r-lg">
                                "The master's tools will never dismantle the master's house. They may allow us temporarily to beat him at his own game, but they will never enable us to bring about genuine change."
                                <footer className="text-sm font-medium mt-2 not-italic">— Audre Lorde</footer>
                            </blockquote>

                            <p className="text-lg leading-relaxed">
                                While we work within the existing system by providing free access to test materials, we recognize this as a temporary measure. The ultimate goal must be the complete dismantling of standardized testing as a gatekeeper to higher education—a system that, as <strong>Alfie Kohn</strong> demonstrates, serves no legitimate educational purpose.
                            </p>
                        </section>

                        <Separator className="my-12" />

                        {/* Call to Action */}
                        <section className="mb-12">
                            <h2 className="text-3xl font-bold mb-6 text-primary">From Critique to Action</h2>

                            <div className="bg-primary/10 border-2 border-primary p-8 rounded-lg mb-6">
                                <h3 className="text-2xl font-bold mb-4">Our Counter-Hegemonic Strategy</h3>

                                <div className="space-y-4">
                                    <p className="text-lg">
                                        <strong>Immediate action:</strong> Providing universal access to all official SAT materials, undermining the College Board's artificial scarcity model and leveling the preparation playing field.
                                    </p>

                                    <p className="text-lg">
                                        <strong>Systemic change:</strong> Documenting and exposing the fundamental inequities in standardized testing to support the growing movement toward test-optional admissions policies.
                                    </p>

                                    <p className="text-lg">
                                        <strong>Educational justice:</strong> Advocating for assessment methods that measure genuine learning rather than socioeconomic privilege, following the lead of institutions that have successfully eliminated standardized testing requirements.
                                    </p>
                                </div>
                            </div>

                            <p className="text-lg leading-relaxed mb-6">
                                This platform represents what <strong>Henry Giroux</strong> calls "critical pedagogy in action"—education that challenges rather than reproduces existing power structures. Every free practice question we provide is an act of resistance against the commodification of learning.
                            </p>

                            <div className="text-center">
                                <p className="text-xl font-semibold mb-6 text-primary">
                                    Until the SAT is abolished, we ensure it cannot be used as a tool of economic exclusion.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button size="lg" className="text-lg px-8 py-4" asChild>
                                        <Link href="/leaked-exams">
                                            Access All Official Tests
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2 border-primary" asChild>
                                        <Link href="/browse-questions">
                                            Browse Question Bank
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Footer Quote */}
                        <section className="text-center">
                            <div className="bg-card p-8 rounded-lg border-2 border-primary">
                                <blockquote className="text-xl italic mb-4 text-primary">
                                    "Education either functions as an instrument of conformity or as the practice of freedom."
                                </blockquote>
                                <footer className="text-lg font-medium">— Paulo Freire, <em>Pedagogy of the Oppressed</em></footer>

                                <p className="text-lg mt-6 text-muted-foreground">
                                    We choose freedom.
                                </p>
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    )
}
