import { Button } from "@/components/ui/button";

const solutions = [
  {
    title: "Otimize seu Controle de Estoque",
    description: "Reduza custos operacionais e evite perdas com um sistema preciso que mantém seus níveis de estoque sempre ideais, através de previsões baseadas em dados históricos e sazonalidade.",
    imageSrc: "/inventory.jpg",
    reverse: false,
    quote: "A excelência no controle de estoque é o primeiro passo para uma operação eficiente."
  },
  {
    title: "Gerencie suas Finanças com Precisão",
    description: "Tenha visibilidade completa sobre a saúde financeira da sua empresa, com dashboards personalizados que destacam oportunidades de crescimento e pontos de atenção em tempo real.",
    imageSrc: "/finance.jpg",
    reverse: true,
    quote: "Informações financeiras precisas são a base para decisões estratégicas acertadas."
  },
  {
    title: "Potencialize sua Gestão de Pessoas",
    description: "Centralize todo o ciclo de vida do colaborador, desde o recrutamento até avaliações de desempenho, promovendo uma cultura organizacional forte e alinhada com seus objetivos.",
    imageSrc: "/hr.jpg",
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
            Desenvolvidas para atender as necessidades específicas da sua empresa, 
            nossas soluções integradas elevam a eficiência operacional a um novo patamar.
          </p>
        </div>
        
        <div className="space-y-24">
          {solutions.map((solution, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${solution.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}
            >
              <div className="lg:w-1/2">
                <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-frico-800/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Placeholder for image - in real implementation this would be an actual image */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 w-full h-full flex items-center justify-center">
                      <span className="text-white text-lg">{solution.title} (Imagem)</span>
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
