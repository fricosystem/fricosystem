export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  perfil: string;
  unidade: string;
  cargo?: string;
  ativo?: string;
  permissoes?: string[];
  imagem_perfil?: string;
  tema?: "light" | "dark";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UsuarioFormData extends Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'> {}
