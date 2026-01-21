import Navbar from "@/components/Navbar";

const LicenseDisclosure = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Divulgação de Licença</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Visão Geral da Licença</h2>
            <p className="mb-4">Esta divulgação fornece informações importantes sobre o programa de licença do APEX HUB e as responsabilidades dos licenciados.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Requisitos Financeiros</h2>
            <p className="mb-4">Os licenciados devem manter:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Requisitos de investimento inicial</li>
              <li>Pagamentos de royalties contínuos</li>
              <li>Contribuições para fundo de marketing</li>
              <li>Reservas de capital de giro</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Padrões Operacionais</h2>
            <p className="mb-4">Os licenciados devem aderir a:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Procedimentos operacionais do APEX HUB</li>
              <li>Padrões de controle de qualidade</li>
              <li>Requisitos de treinamento</li>
              <li>Diretrizes da marca ATOM Corp.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Direitos de Território</h2>
            <p>Detalhes sobre territórios protegidos e oportunidades de expansão serão fornecidos no contrato de licença.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LicenseDisclosure;
