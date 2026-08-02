import { missingEnvVars } from "@/config/env";

/**
 * Tela exibida quando as variáveis de ambiente obrigatórias não estão
 * definidas. Evita a tela branca causada por falha de inicialização do
 * Firebase/Cloudinary e orienta a configuração correta.
 */
const EnvSetupScreen = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground">
          Configuração de ambiente pendente
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O APEX ERP não encontrou as variáveis de ambiente obrigatórias. Defina-as
          no arquivo <code className="text-foreground">.env</code> em desenvolvimento
          ou nas Environment Variables da Vercel em produção. Use
          {" "}<code className="text-foreground">.env.example</code> como referência.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Variáveis ausentes
          </p>
          <ul className="mt-3 space-y-1">
            {missingEnvVars.map((name) => (
              <li key={name} className="font-mono text-sm text-destructive">
                {name}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Após definir as variáveis, reinicie o servidor de desenvolvimento ou
          refaça o deploy para que o build as inclua.
        </p>
      </div>
    </div>
  );
};

export default EnvSetupScreen;
