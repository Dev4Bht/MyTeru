import Link from "next/link";
import { JewelMark } from "@/components/brand/jewel-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="safe-top safe-bottom flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-soft">
          <JewelMark className="h-[18px] w-[18px] text-primary-foreground" />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">DrukSave</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
