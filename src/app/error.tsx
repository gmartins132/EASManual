"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Algo deu errado
          </h1>
          <p className="max-w-sm text-sm text-slate-500">
            Não foi possível completar a operação. Tente novamente em instantes ou
            contate o suporte se o problema persistir.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
