import Link from 'next/link'
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  History,
  Shield,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Ace It!</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <Badge variant="secondary" className="mb-6 text-sm px-3 py-1">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          AI-Powered Study Assistant
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-4xl mx-auto">
          Turn Your Learning Materials Into Practice Quizzes
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload your study materials, choose your quiz settings, and practice with
          AI-generated questions grounded in your own content.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-base px-8" asChild>
            <Link href="/signup">
              Get Started Free
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8" asChild>
            <Link href="/login">Log In to Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">
              Everything you need to study smarter
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Not another generic quiz app — every question comes from your materials.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 border border-border shadow-sm"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              From upload to practice in minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <div key={step.label} className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-lg">
                  {i + 1}
                </div>
                <div className="w-8 h-8 mx-auto mb-3 text-primary">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-foreground">{step.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">
            Ready to ace your exams?
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            Create a free account and start generating quizzes from your study materials
            today.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 text-base px-8"
            asChild
          >
            <Link href="/signup">
              Create Free Account
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Ace It!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ace It! — AI Study Quiz Generator
          </p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Brain,
    title: 'AI Quiz Generation',
    description:
      'AI analyzes your uploaded materials and generates relevant questions — not generic trivia.',
  },
  {
    icon: Shield,
    title: 'Source-Grounded Questions',
    description:
      'Every question, answer, and explanation is traced back to your uploaded content.',
  },
  {
    icon: FileText,
    title: 'Multiple File Support',
    description:
      'Upload PDF, DOCX, PPTX, and TXT files. Mix and match materials for a single quiz.',
  },
  {
    icon: History,
    title: 'Quiz History',
    description:
      'Every attempt is saved. Review your answers, see explanations, and track your progress.',
  },
  {
    icon: Target,
    title: 'Personalized Practice',
    description:
      'The system identifies your weak areas and generates targeted practice quizzes.',
  },
  {
    icon: CheckCircle2,
    title: 'Secure Student Accounts',
    description:
      'Your materials and quiz history are private. We use row-level security to keep data isolated.',
  },
]

const steps = [
  {
    icon: Upload,
    label: 'Upload',
    description: 'Upload your study materials (PDF, DOCX, PPTX, TXT)',
  },
  {
    icon: FileText,
    label: 'Configure',
    description: 'Choose difficulty, question type, and how many questions',
  },
  {
    icon: Sparkles,
    label: 'Generate',
    description: 'AI retrieves relevant content and generates grounded questions',
  },
  {
    icon: BookOpen,
    label: 'Practice',
    description: 'Take the quiz at your own pace',
  },
  {
    icon: CheckCircle2,
    label: 'Review',
    description: 'See your score, review explanations, and practice weak areas',
  },
]
