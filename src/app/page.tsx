import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileCheck2,
  FileText,
  History,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react'
import AceLogo from '@/components/ui/AceLogo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation */}
      <nav className="border-b border-border/80 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <AceLogo size={40} showGlow />
              <div>
                <span className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Ace-It!
                </span>
                <p className="text-[10px] text-muted-foreground font-medium -mt-0.5">AI Study Quiz Generator</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="font-semibold rounded-xl" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 px-5" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 bg-gradient-to-b from-indigo-50/40 via-background to-background dark:from-indigo-950/20">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-400/10 dark:bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Study Smarter. Practice Better. Ace It.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] max-w-4xl mx-auto">
            Turn Your Learning Materials Into{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              Practice Quizzes
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your notes, PDFs, documents, and slides. Ace-It! transforms them into personalized AI-powered quizzes so you can practice smarter and prepare better.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="h-12 text-base px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 font-semibold" asChild>
              <Link href="/signup">
                Get Started Free
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 text-base px-7 rounded-xl font-semibold border-border/80 hover:bg-muted/60" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>

          {/* Trust stats pill */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>100% Grounded in Your Files</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Active Countdown Timers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant Weak-Area Feedback</span>
            </div>
          </div>

          {/* 3. Hero Visual Showcase */}
          <div className="mt-14 max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 opacity-30 blur-xl group-hover:opacity-45 transition duration-1000 group-hover:duration-200" />
            <div className="relative rounded-3xl overflow-hidden border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xl bg-card">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image
                  src="/images/hero_study_ai.jpg"
                  alt="Students studying with Ace-It! interactive AI quiz platform"
                  fill
                  priority
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
                {/* Floating Glassmorphism Badges */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl bg-background/80 dark:bg-slate-950/80 backdrop-blur-md border border-white/20 shadow-lg text-xs font-bold text-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI Study Diagnostics Active</span>
                </div>

                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-950/85 backdrop-blur-md border border-indigo-500/30 shadow-xl text-xs font-semibold text-white">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Interactive Dial Timers & Instant Citations</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Interactive Visual Product Mockup Card */}
          <div className="mt-12 max-w-4xl mx-auto rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-indigo-500/20 via-border/50 to-border/30 border border-indigo-200/60 dark:border-indigo-800/40 shadow-2xl backdrop-blur-sm text-left">
            <div className="rounded-2xl bg-card p-6 sm:p-8 border border-border/80 shadow-inner">
              {/* Quiz Header Mockup */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                    Q 03
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                      Computer Networks & Protocols — Midterm Practice
                    </h2>
                    <p className="text-xs text-muted-foreground">Source: Lecture-Slides-Chapter-4.pdf (p. 18)</p>
                  </div>
                </div>

                {/* Mini Dial Timer Mockup */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>00:18 remaining</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-300">
                    Medium
                  </Badge>
                </div>
              </div>

              {/* Sample Question */}
              <div className="py-6 space-y-4">
                <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
                  What is the primary purpose of VLANs (Virtual Local Area Networks) in an enterprise switched network?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground">A</span>
                    <span className="text-sm font-medium text-foreground">To increase the physical bandwidth of cables</span>
                  </div>
                  <div className="p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono font-bold">B</span>
                    <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">To segment broadcast domains logically without physical recabling</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground">C</span>
                    <span className="text-sm font-medium text-foreground">To assign public IP addresses automatically</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground">D</span>
                    <span className="text-sm font-medium text-foreground">To decrypt encrypted VPN tunneling packets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Cards Section */}
      <section className="py-20 lg:py-28 bg-muted/30 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Engineered for Students</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Everything you need to master your subjects
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              Ace-It! generates exam-style questions strictly from your course files, notes, and textbook chapters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-6 sm:p-7 border border-border/80 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feature.bgColor} ${feature.color} shadow-xs`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 text-xs font-bold text-sky-600 dark:text-sky-400 mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Simple 5-Step Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              From upload to exam readiness in minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: AI Transformation Illustration */}
            <div className="lg:col-span-5 relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 opacity-20 blur-xl group-hover:opacity-35 transition duration-500" />
              <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src="/images/ai_transform_doc.jpg"
                    alt="Study notes and lecture slides transformed into verified practice quizzes by Ace-It!"
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 500px"
                  />
                  <div className="absolute bottom-3 inset-x-3 p-3 rounded-2xl bg-background/85 dark:bg-slate-950/85 backdrop-blur-md border border-white/20 text-center">
                    <p className="text-xs font-bold text-foreground">Multi-Format Document Transformation</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">PDFs, Word Docs, Slides &rarr; Smart Practice Quizzes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 5 Step Timeline */}
            <div className="lg:col-span-7 space-y-3.5">
              {steps.map((step, i) => (
                <div
                  key={step.label}
                  className="bg-card rounded-2xl p-4 sm:p-5 border border-border/80 flex items-start gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    0{i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <step.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h3 className="text-sm sm:text-base font-bold text-foreground">{step.label}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Empowering High Achievers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to ace your exams?
          </h2>

          <p className="text-base sm:text-lg text-indigo-100 max-w-xl mx-auto leading-relaxed">
            Create your free student account now and experience intelligent active recall with source-grounded practice quizzes.
          </p>

          <div className="pt-2">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-white hover:bg-slate-100 text-indigo-950 font-bold rounded-xl shadow-xl transition-all hover:scale-105"
              asChild
            >
              <Link href="/signup">
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-border py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AceLogo size={34} />
            <div>
              <span className="font-bold text-foreground">Ace-It!</span>
              <p className="text-[11px] text-muted-foreground">Study Smarter. Practice Better. Ace It.</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Ace-It! — AI Study Quiz Generator. Built for students worldwide.
          </p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Brain,
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/60',
    color: 'text-indigo-600 dark:text-indigo-400',
    title: 'AI Quiz Generation',
    description:
      'Ace-It! analyzes your uploaded learning materials and generates relevant questions grounded in your course content.',
  },
  {
    icon: ShieldCheck,
    bgColor: 'bg-sky-50 dark:bg-sky-950/60',
    color: 'text-sky-600 dark:text-sky-400',
    title: 'Source-Grounded Questions',
    description:
      'Every question, correct answer, and explanation is cited with exact references to your documents and textbook slides.',
  },
  {
    icon: FileCheck2,
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    color: 'text-emerald-600 dark:text-emerald-400',
    title: 'Multiple File Support',
    description:
      'Upload PDF lecture decks, Word DOCX notes, PowerPoint PPTX slides, and TXT files. Combine multiple materials into one quiz.',
  },
  {
    icon: History,
    bgColor: 'bg-purple-50 dark:bg-purple-950/60',
    color: 'text-purple-600 dark:text-purple-400',
    title: 'Quiz History & Tracking',
    description:
      'Every attempt is safely recorded in your account. Filter by newest, highest score, or difficulty to monitor your growth.',
  },
  {
    icon: Target,
    bgColor: 'bg-amber-50 dark:bg-amber-950/60',
    color: 'text-amber-600 dark:text-amber-400',
    title: 'Personalized Practice',
    description:
      'Ace-It! automatically analyzes your incorrect responses, identifies weak topics, and generates targeted improvement tests.',
  },
  {
    icon: TrendingUp,
    bgColor: 'bg-rose-50 dark:bg-rose-950/60',
    color: 'text-rose-600 dark:text-rose-400',
    title: 'Student Mastery Progress',
    description:
      'Visualize average accuracy, completion velocity, and mastery level with modern student dashboard metrics.',
  },
]

const steps = [
  {
    icon: Upload,
    label: '1. Upload',
    description: 'Upload course notes, slides, or syllabus (PDF, DOCX, PPTX, TXT).',
  },
  {
    icon: FileText,
    label: '2. Configure',
    description: 'Select question count, timer mode, difficulty, and question type.',
  },
  {
    icon: Sparkles,
    label: '3. Generate',
    description: 'AI retrieves key concepts and structures verified questions.',
  },
  {
    icon: BookOpen,
    label: '4. Practice',
    description: 'Take the practice quiz with active dial timer and question navigation.',
  },
  {
    icon: CheckCircle2,
    label: '5. Review',
    description: 'Examine detailed answer reviews, explanations, and weak-area alerts.',
  },
]

