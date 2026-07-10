import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link href="/" className="mb-8 text-sm font-medium uppercase tracking-widest text-accent">
        DrukSave
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
