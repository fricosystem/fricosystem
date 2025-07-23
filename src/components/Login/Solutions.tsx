import { Button } from "@/components/ui/button";

const solutions = [
  {
    title: "Otimize seu Controle de Estoque",
    description: "Reduza custos operacionais e evite perdas com um sistema preciso que mantém seus níveis de estoque sempre ideais, através de previsões baseadas em dados históricos e sazonalidade.",
    imageSrc: "/imagens/inventory.jpg",
    reverse: false,
    quote: "A excelência no controle de estoque é o primeiro passo para uma operação eficiente."
  },
  {
    title: "Gerencie suas Finanças com Precisão",
    description: "Tenha visibilidade completa sobre a saúde financeira da sua empresa, com dashboards personalizados que destacam oportunidades de crescimento e pontos de atenção em tempo real.",
    imageSrc: "/imagens/dashboard.jpg",
    reverse: true,
    quote: "Informações financeiras precisas são a base para decisões estratégicas acertadas."
  },
  {
    title: "Potencialize sua Gestão de Pessoas",
    description: "Centralize todo o ciclo de vida do colaborador, desde o recrutamento até avaliações de desempenho, promovendo uma cultura organizacional forte e alinhada com seus objetivos.",
    imageSrc: "/imagens/recursos-humanos.jpg",
    reverse: false,
    quote: "Pessoas motivadas e bem gerenciadas são o maior ativo de qualquer organização."
  }
];

export function Solutions() {
  return (
    <section id="solutions" className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Nossas Soluções</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-xl">
            O FR Stock Manager foi desenvolvido para atender as necessidades específicas da empresa, 
            trazendo soluções integradas para levar a eficiência operacional a um novo patamar.
          </p>
        </div>
        
        <div className="space-y-24">
          {solutions.map((solution, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${solution.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}
            >
              <div className="lg:w-1/2">
                <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-xl group">
                  {/* Efeito de borda gradiente animado */}
                  <div className="absolute inset-0 rounded-xl p-0.5 bg-transparent group-hover:bg-[conic-gradient(from_var(--shimmer-angle),#00ff87_0%,#7e3af2_20%,#ffffff_40%,#0084ff_60%,#00ff87_80%,#7e3af2_100%)] bg-[length:400%_400%] animate-[shimmer_3s_linear_infinite]">
                    <div className="relative h-full w-full rounded-xl bg-gray-900 overflow-hidden">
                      <img 
                        src={solution.imageSrc} 
                        alt={solution.title}
                        className="w-full h-full object-cover transition-all duration-500 ease-in-out transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-frico-800/20 transition-all duration-300 group-hover:bg-frico-800/10"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2">
                <h3 className="text-2xl font-bold text-white mb-4">{solution.title}</h3>
                <p className="text-gray-400 mb-6">{solution.description}</p>
                <blockquote className="border-l-4 border-frico-600 pl-4 italic mb-6 text-gray-300">
                  "{solution.quote}"
                </blockquote>
                <Button className="bg-frico-600 hover:bg-frico-700">Saiba Mais</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}