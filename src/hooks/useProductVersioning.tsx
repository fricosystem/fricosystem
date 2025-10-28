import { useState } from "react";
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import { ProductVersionService } from "@/services/productVersionService";
import {
  ProductVersion,
  ProductVersionData,
  TipoAlteracao,
  UserInfo,
  VersionComparison
} from "@/types/productVersion";

interface UseProductVersioningReturn {
  loading: boolean;
  createNewVersion: (
    productId: string,
    newData: Partial<ProductVersionData>,
    reason: string,
    userId: string,
    userName: string,
    userEmail: string
  ) => Promise<boolean>;
  getVersionHistory: (productId: string) => Promise<ProductVersion[]>;
  compareVersions: (
    productId: string,
    version1: number,
    version2: number
  ) => Promise<VersionComparison | null>;
  restoreVersion: (
    productId: string,
    versionNumber: number,
    reason: string,
    userId: string,
    userName: string,
    userEmail: string
  ) => Promise<boolean>;
  deactivateProduct: (
    productId: string,
    reason: string,
    userId: string,
    userName: string,
    userEmail: string
  ) => Promise<boolean>;
}

export function useProductVersioning(): UseProductVersioningReturn {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createNewVersion = async (
    productId: string,
    newData: Partial<ProductVersionData>,
    reason: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<boolean> => {
    if (!reason || reason.trim().length < 10) {
      toast({
        title: "Erro de validação",
        description: "O motivo da alteração deve ter no mínimo 10 caracteres",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);

      // Buscar dados atuais do produto
      const productRef = doc(db, "produtos", productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error("Produto não encontrado");
      }

      const currentData = productSnap.data();
      const currentVersionData: ProductVersionData = {
        codigo_estoque: currentData.codigo_estoque || "",
        codigo_material: currentData.codigo_material || "",
        nome: currentData.nome || "",
        quantidade: currentData.quantidade || 0,
        quantidade_minima: currentData.quantidade_minima || 0,
        valor_unitario: currentData.valor_unitario || 0,
        unidade_de_medida: currentData.unidade_de_medida || "",
        deposito: currentData.deposito || "",
        prateleira: currentData.prateleira || "",
        unidade: currentData.unidade || "",
        detalhes: currentData.detalhes || "",
        imagem: currentData.imagem || "",
        data_criacao: currentData.data_criacao || "",
        data_vencimento: currentData.data_vencimento || "",
        fornecedor_id: currentData.fornecedor_id || null,
        fornecedor_nome: currentData.fornecedor_nome || null,
        fornecedor_cnpj: currentData.fornecedor_cnpj || null,
      };

      // Mesclar dados novos com dados atuais
      const updatedData: ProductVersionData = {
        ...currentVersionData,
        ...newData,
      };

      // Verificar se há mudanças
      if (!ProductVersionService.hasChanges(currentVersionData, updatedData)) {
        toast({
          title: "Nenhuma alteração detectada",
          description: "Não é possível criar uma nova versão sem alterações nos dados",
          variant: "destructive",
        });
        return false;
      }

      // Calcular campos alterados
      const changedFields = ProductVersionService.calculateChangedFields(
        currentVersionData,
        updatedData
      );

      const currentVersion = currentData.versao_atual || 0;
      const newVersion = currentVersion + 1;

      const userInfo: UserInfo = {
        id: userId,
        nome: userName,
        email: userEmail,
      };

      // Criar nova versão no histórico
      await ProductVersionService.createVersion(
        productId,
        newVersion,
        "edicao",
        reason,
        updatedData,
        userInfo,
        changedFields
      );

      // Atualizar documento principal do produto
      await updateDoc(productRef, {
        ...updatedData,
        versao_atual: newVersion,
        versao_criada_em: Timestamp.now(),
        versao_criada_por: userInfo,
      });

      toast({
        title: "Nova versão criada",
        description: `Versão ${newVersion} do produto criada com sucesso`,
      });

      return true;
    } catch (error) {
      console.error("Erro ao criar nova versão:", error);
      toast({
        title: "Erro ao criar versão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getVersionHistory = async (productId: string): Promise<ProductVersion[]> => {
    try {
      return await ProductVersionService.getVersionHistory(productId);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast({
        title: "Erro ao buscar histórico",
        description: "Não foi possível carregar o histórico de versões",
        variant: "destructive",
      });
      return [];
    }
  };

  const compareVersions = async (
    productId: string,
    version1: number,
    version2: number
  ): Promise<VersionComparison | null> => {
    try {
      return await ProductVersionService.compareVersions(productId, version1, version2);
    } catch (error) {
      console.error("Erro ao comparar versões:", error);
      toast({
        title: "Erro ao comparar versões",
        description: "Não foi possível comparar as versões selecionadas",
        variant: "destructive",
      });
      return null;
    }
  };

  const restoreVersion = async (
    productId: string,
    versionNumber: number,
    reason: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const versionToRestore = await ProductVersionService.getVersion(productId, versionNumber);
      if (!versionToRestore) {
        throw new Error("Versão não encontrada");
      }

      const reasonText = `${reason} (Restauração da versão ${versionNumber})`;
      return await createNewVersion(
        productId,
        versionToRestore.dados,
        reasonText,
        userId,
        userName,
        userEmail
      );
    } catch (error) {
      console.error("Erro ao restaurar versão:", error);
      toast({
        title: "Erro ao restaurar versão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deactivateProduct = async (
    productId: string,
    reason: string,
    userId: string,
    userName: string,
    userEmail: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const productRef = doc(db, "produtos", productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error("Produto não encontrado");
      }

      const currentData = productSnap.data();
      const currentVersion = currentData.versao_atual || 0;
      const newVersion = currentVersion + 1;

      const userInfo: UserInfo = {
        id: userId,
        nome: userName,
        email: userEmail,
      };

      const currentVersionData: ProductVersionData = {
        codigo_estoque: currentData.codigo_estoque || "",
        codigo_material: currentData.codigo_material || "",
        nome: currentData.nome || "",
        quantidade: currentData.quantidade || 0,
        quantidade_minima: currentData.quantidade_minima || 0,
        valor_unitario: currentData.valor_unitario || 0,
        unidade_de_medida: currentData.unidade_de_medida || "",
        deposito: currentData.deposito || "",
        prateleira: currentData.prateleira || "",
        unidade: currentData.unidade || "",
        detalhes: currentData.detalhes || "",
        imagem: currentData.imagem || "",
        data_criacao: currentData.data_criacao || "",
        data_vencimento: currentData.data_vencimento || "",
        fornecedor_id: currentData.fornecedor_id || null,
        fornecedor_nome: currentData.fornecedor_nome || null,
        fornecedor_cnpj: currentData.fornecedor_cnpj || null,
      };

      // Criar versão de desativação
      await ProductVersionService.createVersion(
        productId,
        newVersion,
        "desativacao",
        reason,
        currentVersionData,
        userInfo
      );

      // Marcar produto como inativo
      await updateDoc(productRef, {
        esta_ativo: false,
        data_desativacao: Timestamp.now(),
        versao_atual: newVersion,
        versao_criada_em: Timestamp.now(),
        versao_criada_por: userInfo,
      });

      toast({
        title: "Produto desativado",
        description: "O produto foi desativado com sucesso",
      });

      return true;
    } catch (error) {
      console.error("Erro ao desativar produto:", error);
      toast({
        title: "Erro ao desativar produto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createNewVersion,
    getVersionHistory,
    compareVersions,
    restoreVersion,
    deactivateProduct,
  };
}
