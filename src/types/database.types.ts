
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nome: string | null
          cargo: string | null
          perfil: string | null
          status: string
          ultimo_acesso: string | null
        }
        Insert: {
          id: string
          email: string
          nome?: string | null
          cargo?: string | null
          perfil?: string | null
          status?: string
          ultimo_acesso?: string | null
        }
        Update: {
          id?: string
          email?: string
          nome?: string | null
          cargo?: string | null
          perfil?: string | null
          status?: string
          ultimo_acesso?: string | null
        }
      }
      logs: {
        Row: {
          id: string
          usuario: string
          acao: string
          data: string
        }
        Insert: {
          id?: string
          usuario: string
          acao: string
          data?: string
        }
        Update: {
          id?: string
          usuario?: string
          acao?: string
          data?: string
        }
      }
      produtos: {
        Row: {
          id: string
          codigo: string
          nome: string
          centro_de_custo: string | null
          quantidade_atual: number
          quantidade_minima: number
          valor_unitario: number
          imagem: string | null
          deposito: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          nome: string
          centro_de_custo?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          valor_unitario?: number
          imagem?: string | null
          deposito?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          nome?: string
          centro_de_custo?: string | null
          quantidade_atual?: number
          quantidade_minima?: number
          valor_unitario?: number
          imagem?: string | null
          deposito?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      configuracoes: {
        Row: {
          id: string
          valor: Json
          updated_at: string
        }
        Insert: {
          id: string
          valor: Json
          updated_at?: string
        }
        Update: {
          id?: string
          valor?: Json
          updated_at?: string
        }
      }
      movimentacoes: {
        Row: {
          id: string
          produto_id: string
          tipo: string
          quantidade: number
          data: string
          usuario: string
        }
        Insert: {
          id?: string
          produto_id: string
          tipo: string
          quantidade: number
          data?: string
          usuario: string
        }
        Update: {
          id?: string
          produto_id?: string
          tipo?: string
          quantidade?: number
          data?: string
          usuario?: string
        }
      }
      notas_fiscais: {
        Row: {
          id: string
          fornecedor: string
          valor: number
          data: string
          status: string
        }
        Insert: {
          id: string
          fornecedor: string
          valor: number
          data?: string
          status?: string
        }
        Update: {
          id?: string
          fornecedor?: string
          valor?: number
          data?: string
          status?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
