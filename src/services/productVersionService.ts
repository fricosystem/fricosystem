import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { 
  ProductVersion, 
  ProductVersionData, 
  TipoAlteracao, 
  UserInfo, 
  VersionComparison 
} from "@/types/productVersion";

export class ProductVersionService {
  private static readonly VERSIONS_COLLECTION = "produtos_versoes";

  /**
   * Cria uma nova versão do produto
   */
  static async createVersion(
    productId: string,
    versionNumber: number,
    tipoAlteracao: TipoAlteracao,
    motivoAlteracao: string,
    dados: ProductVersionData,
    criadoPor: UserInfo,
    camposAlterados?: string[]
  ): Promise<string> {
    const versionData: Omit<ProductVersion, 'id'> = {
      produto_id: productId,
      versao: versionNumber,
      tipo_alteracao: tipoAlteracao,
      motivo_alteracao: motivoAlteracao,
      dados: dados,
      criado_em: Timestamp.now(),
      criado_por: criadoPor,
      campos_alterados: camposAlterados
    };

    const docRef = await addDoc(
      collection(db, this.VERSIONS_COLLECTION),
      versionData
    );

    return docRef.id;
  }

  /**
   * Busca todas as versões de um produto
   */
  static async getVersionHistory(productId: string): Promise<ProductVersion[]> {
    const q = query(
      collection(db, this.VERSIONS_COLLECTION),
      where("produto_id", "==", productId),
      orderBy("versao", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProductVersion));
  }

  /**
   * Busca uma versão específica
   */
  static async getVersion(productId: string, versionNumber: number): Promise<ProductVersion | null> {
    const q = query(
      collection(db, this.VERSIONS_COLLECTION),
      where("produto_id", "==", productId),
      where("versao", "==", versionNumber)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as ProductVersion;
  }

  /**
   * Calcula os campos que foram alterados entre duas versões
   */
  static calculateChangedFields(
    oldData: ProductVersionData,
    newData: ProductVersionData
  ): string[] {
    const changedFields: string[] = [];
    const keys = Object.keys(newData) as (keyof ProductVersionData)[];

    for (const key of keys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Compara duas versões e retorna as diferenças
   */
  static async compareVersions(
    productId: string,
    version1: number,
    version2: number
  ): Promise<VersionComparison | null> {
    const [v1, v2] = await Promise.all([
      this.getVersion(productId, version1),
      this.getVersion(productId, version2)
    ]);

    if (!v1 || !v2) return null;

    const changedFields = this.calculateChangedFields(v1.dados, v2.dados);
    const camposDetalhados = changedFields.map(campo => ({
      campo,
      valor_antigo: v1.dados[campo as keyof ProductVersionData],
      valor_novo: v2.dados[campo as keyof ProductVersionData]
    }));

    return {
      versao_antiga: version1,
      versao_nova: version2,
      campos_alterados: camposDetalhados,
      dados_versao_antiga: v1.dados,
      dados_versao_nova: v2.dados
    };
  }

  /**
   * Conta total de versões de um produto
   */
  static async getTotalVersions(productId: string): Promise<number> {
    const q = query(
      collection(db, this.VERSIONS_COLLECTION),
      where("produto_id", "==", productId)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Valida se há mudanças reais nos dados
   */
  static hasChanges(oldData: ProductVersionData, newData: ProductVersionData): boolean {
    return this.calculateChangedFields(oldData, newData).length > 0;
  }

  /**
   * Formata o nome do campo para exibição
   */
  static getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      codigo_estoque: "Código Estoque",
      codigo_material: "Código Material",
      nome: "Nome",
      quantidade: "Quantidade",
      quantidade_minima: "Quantidade Mínima",
      valor_unitario: "Valor Unitário",
      unidade_de_medida: "Unidade de Medida",
      deposito: "Depósito",
      prateleira: "Prateleira",
      unidade: "Unidade",
      detalhes: "Detalhes",
      imagem: "Imagem",
      data_criacao: "Data Criação",
      data_vencimento: "Data Vencimento",
      fornecedor_id: "Fornecedor ID",
      fornecedor_nome: "Fornecedor",
      fornecedor_cnpj: "CNPJ Fornecedor"
    };

    return labels[fieldName] || fieldName;
  }
}
