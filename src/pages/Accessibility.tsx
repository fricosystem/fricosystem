
import Navbar from "@/components/Navbar";

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Declaração de Acessibilidade</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Nosso Compromisso</h2>
            <p className="mb-4">O APEX HUB, desenvolvido pela ATOM Corp., está comprometido em garantir a acessibilidade digital para pessoas com deficiência. Melhoramos continuamente a experiência do usuário para todos e aplicamos os padrões de acessibilidade relevantes.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Recursos de Acessibilidade</h2>
            <p className="mb-4">Nosso sistema se esforça para incluir:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Compatibilidade com leitores de tela</li>
              <li>Navegação por teclado</li>
              <li>Estrutura de conteúdo clara</li>
              <li>Texto alternativo para imagens</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Feedback</h2>
            <p className="mb-4">Agradecemos seu feedback sobre a acessibilidade do nosso sistema. Entre em contato conosco se encontrar barreiras de acessibilidade.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Melhoria Contínua</h2>
            <p>Estamos comprometidos em manter e melhorar a acessibilidade do nosso sistema à medida que as tecnologias e padrões evoluem.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;
