import { Stethoscope } from 'lucide-react';
import Link from 'next/link';

export function Brand({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-lg">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-card">
        <Stethoscope className="size-5" aria-hidden />
      </span>
      <span className="text-base font-semibold tracking-tight">Doctor Tracker</span>
    </Link>
  );
}
