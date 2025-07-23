import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Carlos Silva",
    position: "Diretor de Operações",
    company: "Distribuidora Nacional",
    content: "O sistema Nexus Hub transformou completamente nossa gestão de estoque. Reduzimos perdas em 35% e aumentamos a eficiência logística em tempo recorde.",
    initials: "CS"
  },
  {
    name: "Ana Ferreira",
    position: "CFO",
    company: "Grupo Alimentício Brasil",
    content: "A visibilidade que temos agora sobre nossos indicadores financeiros é incomparável. As decisões estratégicas organizacionais se tornaram muito mais assertivas e ágeis.",
    initials: "AF"
  },
  {
    name: "Roberto Gomes",
    position: "Gerente de RH",
    company: "Indústria Alimentar SA",
    content: "O módulo de recursos humanos simplificou processos que antes eram extremamente burocráticos. Nossa equipe está mais produtiva e satisfeita.",
    initials: "RG"
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">O que nossos clientes dizem</h2>
          <p className="text-gray-200 max-w-2xl mx-auto text-xl">
            Empresas de todos os portes já experimentaram o poder de transformação 
            do Nexus Hub em suas operações diárias.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gray-900 border-gray-800 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="h-16 w-16 mb-4">
                    <AvatarFallback className="bg-frico-700 text-white text-xl">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{testimonial.name}</p>
                    <p className="text-frico-500">{testimonial.position}</p>
                    <p className="text-gray-500 text-sm">{testimonial.company}</p>
                  </div>
                </div>
                <p className="text-cyan-400 italic text-center">"{testimonial.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
