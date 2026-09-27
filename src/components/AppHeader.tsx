import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function AppHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
            PE
          </div>
          <span className="text-base font-semibold text-slate-900">
            Portal de Empreendimentos
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
