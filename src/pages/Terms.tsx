import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container-blog py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            Termos de Serviço
          </h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o sistema APEX HUB, você aceita e concorda em estar vinculado aos termos e disposições deste acordo. Estes Termos de Serviço regem o uso do nosso sistema e serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Licença de Uso</h2>
              <p>
                É concedida permissão para uso do sistema APEX HUB conforme os termos da sua licença. Esta é a concessão de uma licença, não uma transferência de título, e sob esta licença você não pode:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Content Guidelines</h2>
              <p>
                Users who engage with our content through comments or other interactive features agree to:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Not post harmful, threatening, or inappropriate content</li>
                <li>Respect intellectual property rights</li>
                <li>Not engage in spam or promotional activities without permission</li>
                <li>Maintain respectful discourse in all interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Isenção de Responsabilidade</h2>
              <p>
                Os materiais do sistema APEX HUB são fornecidos "como estão". A ATOM Corp. não oferece garantias, expressas ou implícitas, e por meio deste instrumento renuncia e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um propósito específico ou não violação de propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Limitações</h2>
              <p>
                Em nenhum caso a ATOM Corp. ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro, ou devido à interrupção dos negócios) decorrentes do uso ou incapacidade de usar o sistema APEX HUB.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Revisões</h2>
              <p>
                A ATOM Corp. pode revisar estes termos de serviço a qualquer momento sem aviso prévio. Ao usar este sistema, você concorda em estar vinculado à versão atual destes termos de serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Informações de Contato</h2>
              <p>
                Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através do nosso sistema ou envie um e-mail para contato@atomcorp.com.br.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Last updated: September 2024
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;