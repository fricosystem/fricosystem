import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-gray-950 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Fricó Alimentos</h3>
            <p className="text-gray-400 mb-4">
              Soluções corporativas integradas para maximizar a eficiência operacional 
              da sua empresa no setor alimentício.
            </p>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-400 hover:text-frico-500 transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#solutions" className="text-gray-400 hover:text-frico-500 transition-colors">
                  Soluções
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-gray-400 hover:text-frico-500 transition-colors">
                  Depoimentos
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-frico-500 transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">
                <span className="font-medium text-gray-300">Telefone:</span> +55 (62) 3510-0100
              </li>
              <li>
                <a 
                  href="https://wa.me/556235100100?text=%20" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-frico-500 transition-colors"
                >
                  <span className="font-medium text-gray-300">WhatsApp:</span> Enviar mensagem
                </a>
              </li>
              <li className="text-gray-400">
                <span className="font-medium text-gray-300">Email:</span> contato@fricoalimentos.com.br
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Desenvolvido por</h3>
            <p className="text-gray-400 mb-2">Bruno Moreira de Assis</p>
            <a 
              href="https://wa.me/5562993046419?text=%20%20" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-frico-500 hover:underline"
            >
              Contato do Desenvolvedor
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 mt-8 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} Fricó Alimentos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
