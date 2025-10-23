import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, Warehouse, MapPin, Box, ArrowDownToLine, ArrowLeftRight, 
  TrendingDown, ClipboardList, ShoppingCart, ShoppingBag, Users, 
  Building2, FileSpreadsheet, DollarSign, BarChart3, LayoutDashboard, 
  TrendingUp, Activity, Timer, Cog, Target, Gauge, Settings, 
  Wrench, Clipboard, Calendar, FileText, MessageSquare, Code
} from "lucide-react";

import modulosEstoqueImg from "@/assets/modulos-estoque.jpg";
import modulosLogisticaImg from "@/assets/modulos-logistica.jpg";
import modulosComprasImg from "@/assets/modulos-compras.jpg";
import modulosFinanceiroImg from "@/assets/modulos-financeiro.jpg";
import modulosProducaoImg from "@/assets/modulos-producao.jpg";
import modulosManutencaoImg from "@/assets/modulos-manutencao.jpg";
import modulosAdminImg from "@/assets/modulos-admin.jpg";
import modulosEspecializadosImg from "@/assets/modulos-especializados.jpg";

const categorias = [
  {
    titulo: "Gestão de Estoque e Inventário",
    descricao: "Controle completo do seu estoque com rastreabilidade em tempo real, desde o cadastro de produtos até a gestão física de localização no armazém. Tenha visibilidade total de todos os itens, suas quantidades, localizações e movimentações, garantindo precisão nas operações e reduzindo perdas.",
    imagem: modulosEstoqueImg,
    modulos: [
      {
        title: "Produtos",
        description: "Sistema completo de cadastro e gerenciamento do catálogo de produtos com informações detalhadas, categorização, controle de atributos, imagens, códigos de barras e especificações técnicas. Acompanhe histórico de preços, fornecedores e movimentações.",
        icon: <Package className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Inventário",
        description: "Realize contagens físicas periódicas e auditorias de estoque com precisão. Compare quantidades físicas com o sistema, identifique divergências, gere relatórios de ajustes e mantenha a acuracidade do inventário com processos estruturados.",
        icon: <Warehouse className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Endereçamento",
        description: "Organize o armazém de forma eficiente com sistema de localização inteligente. Defina ruas, corredores, prateleiras e posições específicas para cada produto, otimizando o picking, reduzindo tempo de separação e minimizando erros operacionais.",
        icon: <MapPin className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Gestão de Produtos",
        description: "Controle avançado com categorização hierárquica, gestão de variantes (tamanhos, cores, sabores), controle de lotes e validades, rastreabilidade completa e integração com outros módulos para visão 360° do ciclo de vida do produto.",
        icon: <Box className="h-6 w-6 text-frico-500" />
      }
    ]
  },
  {
    titulo: "Logística e Movimentações",
    descricao: "Gerencie todas as movimentações de produtos com controle rigoroso de entrada, saída, transferências entre unidades e devoluções. Rastreie cada movimentação, mantenha histórico completo e garanta a integridade das informações em toda a cadeia logística da empresa.",
    imagem: modulosLogisticaImg,
    modulos: [
      {
        title: "Entrada de Produtos",
        description: "Registre o recebimento de mercadorias com conferência automatizada via código de barras, validação de notas fiscais, controle de qualidade no recebimento, registro de divergências e integração automática com o estoque.",
        icon: <ArrowDownToLine className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Transferências",
        description: "Movimente produtos entre diferentes unidades, depósitos ou localizações com controle rigoroso. Gere documentos de transferência, rastreie o status em tempo real, confirme recebimento e mantenha inventário atualizado em todas as unidades.",
        icon: <ArrowLeftRight className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Devolução de Materiais",
        description: "Processe devoluções de materiais ao estoque com motivos rastreáveis, inspeção de qualidade, decisão de reintegração ou descarte, documentação completa e ajustes automáticos nos níveis de estoque.",
        icon: <TrendingDown className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Requisições",
        description: "Sistema de solicitação interna de materiais com fluxo de aprovação configurável, controle de permissões por departamento, histórico de requisições, análise de consumo por centro de custo e integração com o processo de separação.",
        icon: <ClipboardList className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Carrinho",
        description: "Módulo de pedidos internos e separação de materiais com interface intuitiva, validação de disponibilidade em tempo real, otimização de rotas de picking, impressão de listas de separação e confirmação de entrega.",
        icon: <ShoppingCart className="h-6 w-6 text-frico-500" />
      }
    ]
  },
  {
    titulo: "Compras e Fornecedores",
    descricao: "Centralize toda a gestão de compras e relacionamento com fornecedores em um único lugar. Desde o cadastro de fornecedores até o lançamento de notas fiscais, passando por cotações, pedidos de compra e avaliação de performance, otimize seu processo de aquisição e reduza custos.",
    imagem: modulosComprasImg,
    modulos: [
      {
        title: "Compras",
        description: "Gestão completa do ciclo de compras desde a requisição até o recebimento. Crie cotações, compare preços de fornecedores, gere pedidos de compra, acompanhe entregas, controle orçamento e analise performance do setor de compras.",
        icon: <ShoppingBag className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Fornecedores",
        description: "Cadastro detalhado de fornecedores com histórico de transações, avaliação de qualidade e pontualidade, documentação (contratos, certificados), condições comerciais, prazos de pagamento e análise comparativa de performance.",
        icon: <Users className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Produtos do Fornecedor",
        description: "Catálogo integrado de produtos por fornecedor com preços negociados, prazos de entrega, quantidades mínimas, histórico de preços, produtos substitutos e alertas de variação de preço para melhores decisões de compra.",
        icon: <Building2 className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Notas Fiscais",
        description: "Lançamento, validação e gestão de notas fiscais de entrada com OCR para leitura automática, validação XML, conferência de impostos, integração contábil, arquivo digital organizado e relatórios fiscais completos.",
        icon: <FileSpreadsheet className="h-6 w-6 text-frico-500" />
      }
    ]
  },
  {
    titulo: "Financeiro e Controle",
    descricao: "Tenha visão financeira completa da operação com dashboards inteligentes, relatórios customizados e análise de custos por departamento ou projeto. Tome decisões baseadas em dados com KPIs em tempo real, tendências históricas e projeções precisas.",
    imagem: modulosFinanceiroImg,
    modulos: [
      {
        title: "Centro de Custo",
        description: "Controle rigoroso de custos segregados por departamentos, projetos ou centros de responsabilidade. Aloque despesas, compare orçado vs realizado, identifique desvios, analise rentabilidade e otimize recursos com relatórios gerenciais detalhados.",
        icon: <DollarSign className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Relatórios",
        description: "Biblioteca completa de relatórios gerenciais e operacionais customizáveis. Exporte em diversos formatos, agende envios automáticos, crie relatórios personalizados com filtros avançados e compartilhe insights com toda a equipe.",
        icon: <BarChart3 className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Dashboard",
        description: "Painéis interativos com indicadores-chave em tempo real, gráficos dinâmicos, alertas configuráveis e visualizações personalizadas por perfil de usuário. Monitore a saúde do negócio de forma visual e intuitiva.",
        icon: <LayoutDashboard className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Estatísticas",
        description: "Análises estatísticas avançadas com identificação de tendências, padrões de consumo, previsões de demanda, sazonalidades, análise ABC de produtos e relatórios comparativos para suporte à tomada de decisões estratégicas.",
        icon: <TrendingUp className="h-6 w-6 text-frico-500" />
      }
    ]
  },
  {
    titulo: "Produção (PCP)",
    descricao: "Planejamento e Controle da Produção completo com gestão de turnos, apontamentos em tempo real, controle de metas, processamento de produtos e análise de resultados. Maximize a eficiência da linha de produção, reduza paradas não planejadas e aumente a produtividade.",
    imagem: modulosProducaoImg,
    modulos: [
      {
        title: "PCP - Planejamento",
        description: "Planejamento inteligente da produção com programação de ordens, sequenciamento otimizado, cálculo de capacidade, gestão de recursos, previsão de demanda e balanceamento de linha para máxima eficiência produtiva.",
        icon: <Activity className="h-6 w-6 text-frico-500" />
      },
      {
        title: "1º Turno",
        description: "Gestão completa do primeiro turno de produção com apontamento digital de produção, registro de paradas, controle de qualidade, monitoramento de performance em tempo real e indicadores OEE (Overall Equipment Effectiveness).",
        icon: <Timer className="h-6 w-6 text-frico-500" />
      },
      {
        title: "2º Turno",
        description: "Controle dedicado ao segundo turno com apontamentos independentes, comparação de performance entre turnos, gestão de equipe, registro de ocorrências e relatórios consolidados para análise de produtividade.",
        icon: <Timer className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Processamento",
        description: "Controle do processamento de produtos com rastreabilidade de lotes, gestão de transformação de matéria-prima, controle de rendimento, apontamento de perdas, análise de eficiência e cálculo automático de custos de produção.",
        icon: <Cog className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Metas",
        description: "Definição e acompanhamento de metas de produção por produto, linha, turno ou período. Monitore atingimento em tempo real, receba alertas de desvios, analise causas de variações e ajuste estratégias para alcançar objetivos.",
        icon: <Target className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Produtos PCP",
        description: "Catálogo especializado de produtos com dados técnicos de produção: tempos de setup, ciclo, capacidade por hora, estrutura (BOM), roteiros de fabricação, pontos críticos de qualidade e histórico de performance produtiva.",
        icon: <Package className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Resultados Finais",
        description: "Consolidação e análise aprofundada de resultados da produção com comparativos históricos, análise de variâncias, identificação de gargalos, cálculo de indicadores (OEE, MTBF, MTTR), relatórios executivos e recomendações de melhoria.",
        icon: <Gauge className="h-6 w-6 text-frico-500" />
      }
    ]
  },
  {
    titulo: "Manutenção e Equipamentos",
    descricao: "Gerencie toda a frota de máquinas e equipamentos com histórico completo de manutenções, ordens de serviço, controle de peças e manutenção preventiva. Reduza tempo de parada, prolongue vida útil dos equipamentos e otimize custos de manutenção.",
    imagem: modulosManutencaoImg,
    modulos: [
      {
        title: "Máquinas/Equipamentos",
        description: "Cadastro detalhado de máquinas e equipamentos com especificações técnicas, manuais, planos de manutenção preventiva, histórico completo de intervenções, controle de garantias, custos de manutenção e indicadores de disponibilidade.",
        icon: <Settings className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Ordens de Serviço",
        description: "Abertura e gestão completa de OS com priorização, alocação de técnicos, registro de tempo e materiais utilizados, acompanhamento de status, anexos de fotos/documentos e histórico de atendimento para análise de recorrências.",
        icon: <Wrench className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Detalhes de Máquina",
        description: "Ficha técnica completa de cada equipamento com histórico detalhado de manutenções corretivas e preventivas, análise de falhas recorrentes, custos acumulados, peças substituídas, documentação técnica e plano de manutenção personalizado.",
        icon: <Clipboard className="h-6 w-6 text-frico-500" />
      }
    ]
  },
  {
    titulo: "Configurações e Administração",
    descricao: "Configure o sistema de acordo com as necessidades da sua empresa, gerencie unidades, defina permissões, planeje melhorias e organize reuniões. Mantenha a governança do sistema e coordene as equipes com ferramentas administrativas completas.",
    imagem: modulosAdminImg,
    modulos: [
      {
        title: "Unidades",
        description: "Cadastro e gestão de todas as unidades da empresa (matriz, filiais, centros de distribuição, fábricas) com estrutura hierárquica, controle de endereços, responsáveis, horários de funcionamento e configurações específicas por localidade.",
        icon: <Building2 className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Administrativo",
        description: "Painel administrativo centralizado com configurações gerais do sistema, gestão de permissões e perfis de acesso, parametrizações, logs de auditoria, backup e restore, integrações e monitoramento da saúde do sistema.",
        icon: <Settings className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Planejamento de Desenvolvimento",
        description: "Gestão completa de projetos de melhoria e evolução do sistema com roadmap de funcionalidades, priorização de demandas, alocação de recursos, acompanhamento de sprints, controle de entregas e histórico de versões.",
        icon: <Calendar className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Agendamento/Reuniões",
        description: "Calendário corporativo integrado para agendamento de reuniões, definição de pautas, convites para participantes, registro de atas, acompanhamento de ações definidas, lembretes automáticos e histórico de reuniões.",
        icon: <Calendar className="h-6 w-6 text-frico-500" />
      }
    ]
  },
  {
    titulo: "Módulos Especializados",
    descricao: "Ferramentas especializadas para necessidades específicas do negócio incluindo medição de lenha, comunicação em tempo real, ambiente de desenvolvimento integrado e importação massiva de dados. Soluções customizadas que agregam valor às operações diárias.",
    imagem: modulosEspecializadosImg,
    modulos: [
      {
        title: "Medida de Lenha",
        description: "Sistema especializado para cubagem e controle de medição de lenha com cálculo preciso de volume, registro de múltiplas medidas, gestão de fornecedores específicos, emissão de comprovantes e relatórios de entrada com rastreabilidade completa.",
        icon: <FileText className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Chat",
        description: "Ferramenta de comunicação interna em tempo real integrada ao sistema, permitindo conversas individuais e em grupo, compartilhamento de arquivos, histórico de mensagens, notificações e melhor coordenação entre equipes.",
        icon: <MessageSquare className="h-6 w-6 text-frico-500" />
      },
      {
        title: "IDE",
        description: "Ambiente de desenvolvimento integrado para customizações avançadas do sistema, edição de código, versionamento, testes, deploy e manutenção de funcionalidades personalizadas com segurança e controle total.",
        icon: <Code className="h-6 w-6 text-frico-500" />
      },
      {
        title: "Importação de Planilhas",
        description: "Ferramenta poderosa para importação em massa de dados via Excel/CSV com validação automática, mapeamento de campos, detecção de erros, preview antes da importação, log de processamento e rollback em caso de problemas.",
        icon: <FileSpreadsheet className="h-6 w-6 text-frico-500" />
      }
    ]
  }
];

export function ModulosSection() {
  return (
    <section id="modulos" className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-white mb-6">
            Módulos Integrados do Sistema
          </h2>
          <p className="text-gray-300 max-w-4xl mx-auto text-xl leading-relaxed">
            Plataforma completa de gestão empresarial com mais de 35 módulos integrados 
            para controlar todos os aspectos da operação. Uma solução 360° que elimina a 
            necessidade de múltiplos sistemas e garante dados unificados em toda a empresa.
          </p>
        </div>

        <div className="space-y-32">
          {categorias.map((categoria, idx) => (
            <div key={idx} className="space-y-12">
              {/* Header com imagem e descrição */}
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}>
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
                    <img 
                      src={categoria.imagem} 
                      alt={categoria.titulo}
                      className="w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                  </div>
                </div>
                <div className={idx % 2 === 1 ? 'lg:order-1' : ''}>
                  <h3 className="text-4xl font-bold text-frico-500 mb-6">
                    {categoria.titulo}
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {categoria.descricao}
                  </p>
                </div>
              </div>

              {/* Grid de módulos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoria.modulos.map((modulo, index) => (
                  <Card 
                    key={index} 
                    className="bg-gray-900/50 border-gray-800 backdrop-blur-sm shadow-xl hover:shadow-frico-500/20 transition-all duration-300 hover:scale-105 hover:border-frico-500/50 hover:bg-gray-900/70"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-center mb-4 p-4 bg-gray-800/50 rounded-full w-16 h-16 mx-auto">
                        {modulo.icon}
                      </div>
                      <CardTitle className="text-center text-white text-xl font-bold">
                        {modulo.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-400 text-center leading-relaxed">
                        {modulo.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <div className="inline-block bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-frico-500/50 rounded-2xl px-12 py-10 shadow-2xl shadow-frico-500/20">
            <p className="text-4xl font-bold text-white mb-4">
              <span className="text-frico-500">35+</span> Módulos Integrados
            </p>
            <p className="text-gray-300 text-lg max-w-2xl">
              Tudo que sua empresa precisa em um único sistema totalmente integrado. 
              Elimine retrabalho, reduza custos e maximize a eficiência operacional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
