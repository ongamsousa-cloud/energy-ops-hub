export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          ativo: boolean
          categoria_id: string
          codigo_item: string
          created_at: string
          created_by: string | null
          descricao: string
          exige_foto_antes: boolean
          exige_foto_depois: boolean
          exige_foto_durante: boolean
          exige_localizacao: boolean
          id: string
          observacao: string | null
          umd_unitaria: number
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          codigo_item: string
          created_at?: string
          created_by?: string | null
          descricao: string
          exige_foto_antes?: boolean
          exige_foto_depois?: boolean
          exige_foto_durante?: boolean
          exige_localizacao?: boolean
          id?: string
          observacao?: string | null
          umd_unitaria?: number
          unidade: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          codigo_item?: string
          created_at?: string
          created_by?: string | null
          descricao?: string
          exige_foto_antes?: boolean
          exige_foto_depois?: boolean
          exige_foto_durante?: boolean
          exige_localizacao?: boolean
          id?: string
          observacao?: string | null
          umd_unitaria?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          dados: Json | null
          id: string
          modulo: string | null
          registro_id: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados?: Json | null
          id?: string
          modulo?: string | null
          registro_id?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados?: Json | null
          id?: string
          modulo?: string | null
          registro_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      equipe_membros: {
        Row: {
          created_at: string
          equipe_id: string
          funcao: string | null
          id: string
          profissional_id: string
        }
        Insert: {
          created_at?: string
          equipe_id: string
          funcao?: string | null
          id?: string
          profissional_id: string
        }
        Update: {
          created_at?: string
          equipe_id?: string
          funcao?: string | null
          id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipe_membros_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipe_membros_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          regiao: string | null
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          regiao?: string | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          regiao?: string | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          latitude: number | null
          longitude: number | null
          os_atividade_id: string | null
          os_id: string
          storage_path: string
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          os_atividade_id?: string | null
          os_id: string
          storage_path: string
          tipo?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          os_atividade_id?: string | null
          os_id?: string
          storage_path?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_os_atividade_id_fkey"
            columns: ["os_atividade_id"]
            isOneToOne: false
            referencedRelation: "os_atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      obra_equipes: {
        Row: {
          equipe_id: string
          obra_id: string
        }
        Insert: {
          equipe_id: string
          obra_id: string
        }
        Update: {
          equipe_id?: string
          obra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_equipes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_equipes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cliente: string | null
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          numero: string
          observacoes: string | null
          previsao_conclusao: string | null
          responsavel_tecnico: string | null
          status: Database["public"]["Enums"]["obra_status"]
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          numero: string
          observacoes?: string | null
          previsao_conclusao?: string | null
          responsavel_tecnico?: string | null
          status?: Database["public"]["Enums"]["obra_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          numero?: string
          observacoes?: string | null
          previsao_conclusao?: string | null
          responsavel_tecnico?: string | null
          status?: Database["public"]["Enums"]["obra_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          created_by: string | null
          equipe_id: string | null
          fim_em: string | null
          fim_lat: number | null
          fim_lng: number | null
          id: string
          inicio_em: string
          inicio_lat: number | null
          inicio_lng: number | null
          motivo_reprovacao: string | null
          numero: string
          obra_id: string
          observacao_supervisor: string | null
          observacoes: string | null
          profissional_id: string
          status: Database["public"]["Enums"]["os_status"]
          supervisor_id: string | null
          total_umd: number
          total_umd_aprovada: number
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          created_by?: string | null
          equipe_id?: string | null
          fim_em?: string | null
          fim_lat?: number | null
          fim_lng?: number | null
          id?: string
          inicio_em?: string
          inicio_lat?: number | null
          inicio_lng?: number | null
          motivo_reprovacao?: string | null
          numero?: string
          obra_id: string
          observacao_supervisor?: string | null
          observacoes?: string | null
          profissional_id: string
          status?: Database["public"]["Enums"]["os_status"]
          supervisor_id?: string | null
          total_umd?: number
          total_umd_aprovada?: number
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          created_by?: string | null
          equipe_id?: string | null
          fim_em?: string | null
          fim_lat?: number | null
          fim_lng?: number | null
          id?: string
          inicio_em?: string
          inicio_lat?: number | null
          inicio_lng?: number | null
          motivo_reprovacao?: string | null
          numero?: string
          obra_id?: string
          observacao_supervisor?: string | null
          observacoes?: string | null
          profissional_id?: string
          status?: Database["public"]["Enums"]["os_status"]
          supervisor_id?: string | null
          total_umd?: number
          total_umd_aprovada?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      os_atividades: {
        Row: {
          atividade_id: string
          categoria_id: string
          created_at: string
          created_by: string | null
          id: string
          latitude: number | null
          longitude: number | null
          observacao: string | null
          observacao_supervisor: string | null
          os_id: string
          quantidade: number
          status: Database["public"]["Enums"]["lancamento_status"]
          umd_total: number
          umd_unitaria: number
          unidade: string
        }
        Insert: {
          atividade_id: string
          categoria_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          observacao_supervisor?: string | null
          os_id: string
          quantidade: number
          status?: Database["public"]["Enums"]["lancamento_status"]
          umd_total: number
          umd_unitaria: number
          unidade: string
        }
        Update: {
          atividade_id?: string
          categoria_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacao?: string | null
          observacao_supervisor?: string | null
          os_id?: string
          quantidade?: number
          status?: Database["public"]["Enums"]["lancamento_status"]
          umd_total?: number
          umd_unitaria?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_atividades_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_atividades_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          cargo: string | null
          cpf: string | null
          created_at: string
          email: string
          especialidade: string | null
          foto_url: string | null
          id: string
          nome: string
          telefone: string | null
          ultimo_acesso: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          especialidade?: string | null
          foto_url?: string | null
          id: string
          nome: string
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          especialidade?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "gestor"
        | "supervisor"
        | "campo"
        | "financeiro"
        | "auditor"
      lancamento_status: "pendente" | "aprovado" | "reprovado" | "correcao"
      obra_status:
        | "aberta"
        | "planejamento"
        | "execucao"
        | "pausada"
        | "aguardando_material"
        | "aguardando_aprovacao"
        | "concluida"
        | "cancelada"
      os_status:
        | "rascunho"
        | "iniciada"
        | "em_andamento"
        | "finalizada"
        | "aguardando_revisao"
        | "em_revisao"
        | "correcao_solicitada"
        | "corrigida"
        | "aprovada"
        | "reprovada"
        | "faturada"
        | "cancelada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "gestor",
        "supervisor",
        "campo",
        "financeiro",
        "auditor",
      ],
      lancamento_status: ["pendente", "aprovado", "reprovado", "correcao"],
      obra_status: [
        "aberta",
        "planejamento",
        "execucao",
        "pausada",
        "aguardando_material",
        "aguardando_aprovacao",
        "concluida",
        "cancelada",
      ],
      os_status: [
        "rascunho",
        "iniciada",
        "em_andamento",
        "finalizada",
        "aguardando_revisao",
        "em_revisao",
        "correcao_solicitada",
        "corrigida",
        "aprovada",
        "reprovada",
        "faturada",
        "cancelada",
      ],
    },
  },
} as const
