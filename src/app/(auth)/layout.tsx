import Link from 'next/link'
import AceLogo from '@/components/ui/AceLogo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-background to-background dark:from-indigo-950/20 flex flex-col relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-sky-500/10 blur-3xl rounded-full pointer-events-none" />

      <header className="p-4 sm:p-6 relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <AceLogo size={40} showGlow />
          <div>
            <span className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Ace-It!
            </span>
            <p className="text-[10px] text-muted-foreground font-medium -mt-0.5">Study Smarter. Practice Better.</p>
          </div>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        {children}
      </main>
    </div>
  )
}
