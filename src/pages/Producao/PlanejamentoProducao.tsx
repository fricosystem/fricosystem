import { useState, useEffect, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import DiaPlanejamentoComponent from "@/components/Planejamento/DiaPlanejamento";
import AppLayout from '@/layouts/AppLayout';
import { useProdutosPlanejamento } from '@/pages/Producao/Componentes/useProdutosPlanejamento';

const PlanejamentoProducaoContent = () => {
  const hoje = new Date();
  const [diaAtual, setDiaAtual] = useState<string>(format(hoje, "yyyy-MM-dd"));
  
  const {
    dias,
    produtosEstoque,
    isLoading,
    isSaving,
    saveError,
    carregandoProdutos,
    handleAddProduto,
    handleRemoveProduto,
    handleStatusChange,
    handleSalvarPlanejamento
  } = useProdutosPlanejamento();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={handleSalvarPlanejamento} disabled={isSaving}>
          {isSaving ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue={diaAtual} onValueChange={setDiaAtual}>
        <TabsList className="grid grid-cols-7 mb-4">
          {dias.map((dia, index) => (
            <TabsTrigger
              key={index}
              value={format(dia.data, 'yyyy-MM-dd')}
              className="flex flex-col"
            >
              <span>{format(dia.data, 'EEE', { locale: ptBR })}</span>
              <span className="text-xs">{format(dia.data, 'dd/MM')}</span>
              {dia.produtos.length > 0 && (
                <Badge variant="secondary" className="mt-1">
                  {dia.produtos.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          dias.map((dia, diaIndex) => (
            <TabsContent
              key={diaIndex}
              value={format(dia.data, 'yyyy-MM-dd')}
              className="space-y-4"
            >
              <DiaPlanejamentoComponent 
                dia={dia}
                diaIndex={diaIndex}
                produtos={produtosEstoque}
                carregandoProdutos={carregandoProdutos}
                handleAddProduto={handleAddProduto}
                handleRemoveProduto={handleRemoveProduto}
                handleStatusChange={handleStatusChange}
              />
            </TabsContent>
          ))
        )}
      </Tabs>

      {saveError && (
        <div className="p-4 mt-4 bg-red-50 text-red-800 rounded-md border border-red-200">
          {saveError}
        </div>
      )}
    </div>
  );
};

const PlanejamentoProducao = () => {
  return (
    <AppLayout title="Planejamento de Produção">
      <PlanejamentoProducaoContent />
    </AppLayout>
  );
};

export default PlanejamentoProducao;