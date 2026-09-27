import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1d2b53,_#0d1526)] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-lg font-semibold text-white">
            PE
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Portal de Empreendimentos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Acesse com suas credenciais internas
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
