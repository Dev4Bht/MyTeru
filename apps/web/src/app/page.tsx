import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JewelMark } from "@/components/brand/jewel-mark";

export default function HomePage() {
  return (
    <main className="safe-top safe-bottom flex min-h-screen flex-col items-center bg-background px-6 pb-16 pt-12">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lift">
          <JewelMark className="h-7 w-7 text-primary-foreground" />
        </span>

        <Badge variant="primary">Built for the Land of the Thunder Dragon</Badge>

        <div className="space-y-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Helping Bhutan <span className="italic text-primary">save smarter.</span>
          </h1>
          <p className="mx-auto max-w-sm text-muted-foreground">
            Your AI-powered financial companion — built for Ngultrum, government salary cycles, and Losar.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="soft" className="w-full sm:w-auto">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>

      <div className="relative mt-14 w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground shadow-lift">
        <div className="pattern-clouds pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
              This month
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <JewelMark className="h-3.5 w-3.5 text-primary-foreground" />
            </span>
          </div>
          <p className="mt-3 font-tnum font-display text-4xl font-semibold tracking-tight">Nu. 24,650.00</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                <TrendingUp className="h-3.5 w-3.5" />
                Income
              </div>
              <p className="mt-1 font-tnum text-base font-semibold">Nu. 45,000.00</p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                <TrendingDown className="h-3.5 w-3.5" />
                Expenses
              </div>
              <p className="mt-1 font-tnum text-base font-semibold">Nu. 20,350.00</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">Made with care for Druk Yul 🇧🇹</p>
    </main>
  );
}
