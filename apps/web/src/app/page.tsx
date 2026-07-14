import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-background to-secondary px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">DrukSave</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Helping Bhutan Save Smarter.
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Your AI-powered financial companion — built for Ngultrum, government
          salary cycles, and Losar.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </main>
  );
}
