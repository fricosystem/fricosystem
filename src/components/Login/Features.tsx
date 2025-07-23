import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart4, Calendar, Clipboard, CreditCard, Database, FileText, Users } from "lucide-react";

const features = [
  {
    title: "Gestão de Estoque",
    description: "Controle total sobre o inventário com rastreamento em tempo real, previsão inteligente de demanda e alertas automatizados de reposição.",
    icon: <Database className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Gestão Financeira",
    description: "Acompanhamento detalhado de receitas e despesas, relatórios personalizados e integrado com processos contábeis.",
    icon: <CreditCard className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Recursos Humanos",
    description: "Administração completa de colaboradores, folha de pagamento, recrutamento, treinamentos e avaliações de desempenho.",
    icon: <Users className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Planejamento Estratégico",
    description: "Tenha controle total sobre sua operação: alinhe o planejamento estratégico com indicadores de estoque e garanta uma gestão eficiente.",
    icon: <BarChart4 className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Gestão de Documentos",
    description: "Organize, armazene e compartilhe documentos com segurança, mantendo todo o controle organizacional.",
    icon: <FileText className="h-10 w-10 text-frico-500" />
  },
  {
    title: "Calendário Corporativo",
    description: "Sincronização de eventos, reuniões e deadlines para toda a equipe com notificações inteligentes.",
    icon: <Calendar className="h-10 w-10 text-frico-500" />
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-950 text-xl">
      <div className="container mx-auto px-4 text-xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Funcionalidades Integradas</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-xl">
            Nossa plataforma centraliza todas as operações essenciais da empresa em um único lugar, 
            proporcionando facilidade, eficiência e acertividade em cada processo.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-gray-900 border-gray-800 shadow-lg hover:shadow-frico-900/10 transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-center text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400 text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
