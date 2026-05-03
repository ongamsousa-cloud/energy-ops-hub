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
      audit_cases: {
        Row: {
          audit_type: string | null
          auditor_id: string
          completed_at: string | null
          created_at: string | null
          final_decision: string | null
          findings_count: number | null
          id: string
          recommendation: string | null
          risk_level: string | null
          service_order_id: string
          started_at: string | null
          status: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          audit_type?: string | null
          auditor_id: string
          completed_at?: string | null
          created_at?: string | null
          final_decision?: string | null
          findings_count?: number | null
          id?: string
          recommendation?: string | null
          risk_level?: string | null
          service_order_id: string
          started_at?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_type?: string | null
          auditor_id?: string
          completed_at?: string | null
          created_at?: string | null
          final_decision?: string | null
          findings_count?: number | null
          id?: string
          recommendation?: string | null
          risk_level?: string | null
          service_order_id?: string
          started_at?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_cases_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_checklist_items: {
        Row: {
          audit_case_id: string
          created_at: string | null
          id: string
          item_key: string
          item_label: string
          notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          audit_case_id: string
          created_at?: string | null
          id?: string
          item_key: string
          item_label: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_case_id?: string
          created_at?: string | null
          id?: string
          item_key?: string
          item_label?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_checklist_items_audit_case_id_fkey"
            columns: ["audit_case_id"]
            isOneToOne: false
            referencedRelation: "audit_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_evidence_reviews: {
        Row: {
          audit_case_id: string
          created_at: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string
          service_order_media_id: string
          status: string | null
        }
        Insert: {
          audit_case_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by: string
          service_order_media_id: string
          status?: string | null
        }
        Update: {
          audit_case_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string
          service_order_media_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_evidence_reviews_audit_case_id_fkey"
            columns: ["audit_case_id"]
            isOneToOne: false
            referencedRelation: "audit_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_case_id: string
          created_at: string | null
          description: string | null
          finding_type: string
          id: string
          related_user_id: string | null
          service_order_id: string
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audit_case_id: string
          created_at?: string | null
          description?: string | null
          finding_type: string
          id?: string
          related_user_id?: string | null
          service_order_id: string
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audit_case_id?: string
          created_at?: string | null
          description?: string | null
          finding_type?: string
          id?: string
          related_user_id?: string | null
          service_order_id?: string
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_case_id_fkey"
            columns: ["audit_case_id"]
            isOneToOne: false
            referencedRelation: "audit_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
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
      audit_requests: {
        Row: {
          audit_case_id: string | null
          created_at: string | null
          due_at: string | null
          id: string
          message: string
          requested_by: string
          requested_to: string
          responded_at: string | null
          response: string | null
          service_order_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          audit_case_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          message: string
          requested_by: string
          requested_to: string
          responded_at?: string | null
          response?: string | null
          service_order_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_case_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          message?: string
          requested_by?: string
          requested_to?: string
          responded_at?: string | null
          response?: string | null
          service_order_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_requests_audit_case_id_fkey"
            columns: ["audit_case_id"]
            isOneToOne: false
            referencedRelation: "audit_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_requests_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
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
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          ultima_leitura: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          ultima_leitura?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          ultima_leitura?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          obra_id: string | null
          tipo: string
          titulo: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          obra_id?: string | null
          tipo?: string
          titulo?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          obra_id?: string | null
          tipo?: string
          titulo?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
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
          department_id: string | null
          id: string
          manager_id: string | null
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
          department_id?: string | null
          id?: string
          manager_id?: string | null
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
          department_id?: string | null
          id?: string
          manager_id?: string | null
          nome?: string
          observacoes?: string | null
          regiao?: string | null
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
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
      execution_codes: {
        Row: {
          active: boolean | null
          category: string | null
          checklist_template: Json | null
          code: string
          created_at: string | null
          default_instructions: string | null
          description: string | null
          id: string
          required_fields: Json | null
          service_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          checklist_template?: Json | null
          code: string
          created_at?: string | null
          default_instructions?: string | null
          description?: string | null
          id?: string
          required_fields?: Json | null
          service_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          checklist_template?: Json | null
          code?: string
          created_at?: string | null
          default_instructions?: string | null
          description?: string | null
          id?: string
          required_fields?: Json | null
          service_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_history: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          financial_record_id: string | null
          id: string
          new_status: string | null
          new_value: number | null
          previous_status: string | null
          previous_value: number | null
          service_order_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          financial_record_id?: string | null
          id?: string
          new_status?: string | null
          new_value?: number | null
          previous_status?: string | null
          previous_value?: number | null
          service_order_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          financial_record_id?: string | null
          id?: string
          new_status?: string | null
          new_value?: number | null
          previous_status?: string | null
          previous_value?: number | null
          service_order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_history_financial_record_id_fkey"
            columns: ["financial_record_id"]
            isOneToOne: false
            referencedRelation: "financial_order_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_history_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_material_records: {
        Row: {
          created_at: string | null
          execution_record_id: string | null
          expected_quantity: number | null
          financial_status: string | null
          id: string
          is_extra: boolean | null
          material_code: string | null
          material_name: string
          notes: string | null
          quantity: number
          service_order_id: string
          supervisor_id: string | null
          technician_id: string | null
          total_cost: number | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          execution_record_id?: string | null
          expected_quantity?: number | null
          financial_status?: string | null
          id?: string
          is_extra?: boolean | null
          material_code?: string | null
          material_name: string
          notes?: string | null
          quantity: number
          service_order_id: string
          supervisor_id?: string | null
          technician_id?: string | null
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          execution_record_id?: string | null
          expected_quantity?: number | null
          financial_status?: string | null
          id?: string
          is_extra?: boolean | null
          material_code?: string | null
          material_name?: string
          notes?: string | null
          quantity?: number
          service_order_id?: string
          supervisor_id?: string | null
          technician_id?: string | null
          total_cost?: number | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_material_records_execution_record_id_fkey"
            columns: ["execution_record_id"]
            isOneToOne: false
            referencedRelation: "service_execution_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_material_records_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_order_records: {
        Row: {
          adjusted_value: number | null
          adjustment_reason: string | null
          analyzed_at: string | null
          analyzed_by: string | null
          approved_value: number | null
          created_at: string | null
          estimated_cost: number | null
          financial_status: string | null
          id: string
          is_billable: boolean | null
          notes: string | null
          real_cost: number | null
          service_order_id: string
          updated_at: string | null
        }
        Insert: {
          adjusted_value?: number | null
          adjustment_reason?: string | null
          analyzed_at?: string | null
          analyzed_by?: string | null
          approved_value?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          financial_status?: string | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          real_cost?: number | null
          service_order_id: string
          updated_at?: string | null
        }
        Update: {
          adjusted_value?: number | null
          adjustment_reason?: string | null
          analyzed_at?: string | null
          analyzed_by?: string | null
          approved_value?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          financial_status?: string | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          real_cost?: number | null
          service_order_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_order_records_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: true
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports_cache: {
        Row: {
          created_at: string | null
          data_snapshot: Json | null
          filters: Json | null
          generated_by: string | null
          id: string
          period_end: string | null
          period_start: string | null
          report_type: string
        }
        Insert: {
          created_at?: string | null
          data_snapshot?: Json | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_type: string
        }
        Update: {
          created_at?: string | null
          data_snapshot?: Json | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_type?: string
        }
        Relationships: []
      }
      financial_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          rule_config: Json | null
          rule_key: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          rule_config?: Json | null
          rule_key: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          rule_config?: Json | null
          rule_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      management_exceptions: {
        Row: {
          created_at: string | null
          decision_reason: string | null
          exception_type: string
          id: string
          impact_description: string | null
          reason: string
          requested_at: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          service_order_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decision_reason?: string | null
          exception_type: string
          id?: string
          impact_description?: string | null
          reason: string
          requested_at?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_order_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decision_reason?: string | null
          exception_type?: string
          id?: string
          impact_description?: string | null
          reason?: string
          requested_at?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_order_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_exceptions_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      management_messages: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          message: string
          read_at: string | null
          receiver_id: string | null
          sender_id: string
          service_order_id: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          message: string
          read_at?: string | null
          receiver_id?: string | null
          sender_id: string
          service_order_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          message?: string
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
          service_order_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_messages_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_messages_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      managers: {
        Row: {
          active: boolean | null
          created_at: string | null
          department_id: string | null
          id: string
          manager_type: string
          permission_level: number | null
          region_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          manager_type?: string
          permission_level?: number | null
          region_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          manager_type?: string
          permission_level?: number | null
          region_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "managers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          anexo_tipo: string | null
          anexo_url: string | null
          conteudo: string | null
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          anexo_tipo?: string | null
          anexo_url?: string | null
          conteudo?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          anexo_tipo?: string | null
          anexo_url?: string | null
          conteudo?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          service_order_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          service_order_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          service_order_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
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
      operational_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          service_order_id: string | null
          severity: string | null
          status: string | null
          supervisor_id: string | null
          technician_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          service_order_id?: string | null
          severity?: string | null
          status?: string | null
          supervisor_id?: string | null
          technician_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          service_order_id?: string | null
          severity?: string | null
          status?: string | null
          supervisor_id?: string | null
          technician_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_alerts_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          period_end: string
          period_start: string
          reference_id: string | null
          reference_type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          period_end: string
          period_start: string
          reference_id?: string | null
          reference_type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          period_end?: string
          period_start?: string
          reference_id?: string | null
          reference_type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          assigned_manager_id: string | null
          assigned_supervisor_id: string | null
          audit_status: Database["public"]["Enums"]["os_audit_status"] | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          created_at: string
          created_by: string | null
          criticality_level: string | null
          data_agendada: string | null
          due_at: string | null
          endereco_completo: string | null
          equipe_id: string | null
          estado: string | null
          fim_atendimento: string | null
          fim_em: string | null
          fim_lat: number | null
          fim_lng: number | null
          financial_status:
            | Database["public"]["Enums"]["os_financial_status"]
            | null
          hora_agendada: string | null
          id: string
          inicio_atendimento: string | null
          inicio_em: string
          inicio_lat: number | null
          inicio_lng: number | null
          local_lat: number | null
          local_lng: number | null
          localizacao_gps: Json | null
          motivo_reprovacao: string | null
          numero: string
          obra_id: string
          observacao_supervisor: string | null
          observacoes: string | null
          observacoes_admin: string | null
          operational_status:
            | Database["public"]["Enums"]["os_operational_status"]
            | null
          prioridade: string | null
          profissional_id: string
          region_id: string | null
          status: Database["public"]["Enums"]["os_status"]
          status_financeiro: string | null
          supervisor_id: string | null
          total_umd: number
          total_umd_aprovada: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          valor_aprovado: number | null
          valor_previsto: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          assigned_manager_id?: string | null
          assigned_supervisor_id?: string | null
          audit_status?: Database["public"]["Enums"]["os_audit_status"] | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          criticality_level?: string | null
          data_agendada?: string | null
          due_at?: string | null
          endereco_completo?: string | null
          equipe_id?: string | null
          estado?: string | null
          fim_atendimento?: string | null
          fim_em?: string | null
          fim_lat?: number | null
          fim_lng?: number | null
          financial_status?:
            | Database["public"]["Enums"]["os_financial_status"]
            | null
          hora_agendada?: string | null
          id?: string
          inicio_atendimento?: string | null
          inicio_em?: string
          inicio_lat?: number | null
          inicio_lng?: number | null
          local_lat?: number | null
          local_lng?: number | null
          localizacao_gps?: Json | null
          motivo_reprovacao?: string | null
          numero?: string
          obra_id: string
          observacao_supervisor?: string | null
          observacoes?: string | null
          observacoes_admin?: string | null
          operational_status?:
            | Database["public"]["Enums"]["os_operational_status"]
            | null
          prioridade?: string | null
          profissional_id: string
          region_id?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          status_financeiro?: string | null
          supervisor_id?: string | null
          total_umd?: number
          total_umd_aprovada?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          valor_aprovado?: number | null
          valor_previsto?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          assigned_manager_id?: string | null
          assigned_supervisor_id?: string | null
          audit_status?: Database["public"]["Enums"]["os_audit_status"] | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          criticality_level?: string | null
          data_agendada?: string | null
          due_at?: string | null
          endereco_completo?: string | null
          equipe_id?: string | null
          estado?: string | null
          fim_atendimento?: string | null
          fim_em?: string | null
          fim_lat?: number | null
          fim_lng?: number | null
          financial_status?:
            | Database["public"]["Enums"]["os_financial_status"]
            | null
          hora_agendada?: string | null
          id?: string
          inicio_atendimento?: string | null
          inicio_em?: string
          inicio_lat?: number | null
          inicio_lng?: number | null
          local_lat?: number | null
          local_lng?: number | null
          localizacao_gps?: Json | null
          motivo_reprovacao?: string | null
          numero?: string
          obra_id?: string
          observacao_supervisor?: string | null
          observacoes?: string | null
          observacoes_admin?: string | null
          operational_status?:
            | Database["public"]["Enums"]["os_operational_status"]
            | null
          prioridade?: string | null
          profissional_id?: string
          region_id?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          status_financeiro?: string | null
          supervisor_id?: string | null
          total_umd?: number
          total_umd_aprovada?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          valor_aprovado?: number | null
          valor_previsto?: number | null
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
      os_audit_logs: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string
          os_id: string | null
          status_anterior: string | null
          status_novo: string
          user_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          os_id?: string | null
          status_anterior?: string | null
          status_novo: string
          user_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          os_id?: string | null
          status_anterior?: string | null
          status_novo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_audit_logs_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      os_evidences: {
        Row: {
          created_at: string | null
          id: string
          localizacao: Json | null
          metadata: Json | null
          os_id: string | null
          tipo: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          localizacao?: Json | null
          metadata?: Json | null
          os_id?: string | null
          tipo?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          localizacao?: Json | null
          metadata?: Json | null
          os_id?: string | null
          tipo?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_evidences_os_id_fkey"
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
          department_id: string | null
          documento: string | null
          email: string
          especialidade: string | null
          foto_url: string | null
          id: string
          manager_id: string | null
          nome: string
          supervisor_id: string | null
          telefone: string | null
          ultimo_acesso: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          department_id?: string | null
          documento?: string | null
          email: string
          especialidade?: string | null
          foto_url?: string | null
          id: string
          manager_id?: string | null
          nome: string
          supervisor_id?: string | null
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          department_id?: string | null
          documento?: string | null
          email?: string
          especialidade?: string | null
          foto_url?: string | null
          id?: string
          manager_id?: string | null
          nome?: string
          supervisor_id?: string | null
          telefone?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      service_execution_records: {
        Row: {
          checklist_answers: Json | null
          created_at: string | null
          end_time: string | null
          execution_code_id: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          materials_used: Json | null
          problems_found: string | null
          reason_not_executed: string | null
          service_order_id: string
          solution_applied: string | null
          start_time: string | null
          status: string
          submitted_at: string | null
          technical_notes: string | null
          technician_id: string
          total_duration: string | null
          updated_at: string | null
        }
        Insert: {
          checklist_answers?: Json | null
          created_at?: string | null
          end_time?: string | null
          execution_code_id?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          materials_used?: Json | null
          problems_found?: string | null
          reason_not_executed?: string | null
          service_order_id: string
          solution_applied?: string | null
          start_time?: string | null
          status: string
          submitted_at?: string | null
          technical_notes?: string | null
          technician_id: string
          total_duration?: string | null
          updated_at?: string | null
        }
        Update: {
          checklist_answers?: Json | null
          created_at?: string | null
          end_time?: string | null
          execution_code_id?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          materials_used?: Json | null
          problems_found?: string | null
          reason_not_executed?: string | null
          service_order_id?: string
          solution_applied?: string | null
          start_time?: string | null
          status?: string
          submitted_at?: string | null
          technical_notes?: string | null
          technician_id?: string
          total_duration?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_execution_records_execution_code_id_fkey"
            columns: ["execution_code_id"]
            isOneToOne: false
            referencedRelation: "execution_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_execution_records_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_history: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          metadata: Json | null
          new_status: string | null
          previous_status: string | null
          service_order_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
          service_order_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          previous_status?: string | null
          service_order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_history_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_media: {
        Row: {
          captured_at: string | null
          created_at: string | null
          description: string | null
          execution_record_id: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          media_type: string
          service_order_id: string
          stage: string | null
          technician_id: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string | null
          description?: string | null
          execution_record_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          media_type: string
          service_order_id: string
          stage?: string | null
          technician_id: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string | null
          description?: string | null
          execution_record_id?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          media_type?: string
          service_order_id?: string
          stage?: string | null
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_media_execution_record_id_fkey"
            columns: ["execution_record_id"]
            isOneToOne: false
            referencedRelation: "service_execution_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_media_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_messages: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          receiver_id: string | null
          sender_id: string
          service_order_id: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          receiver_id?: string | null
          sender_id: string
          service_order_id: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
          service_order_id?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_messages_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_validations: {
        Row: {
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string
          service_order_id: string
          status: string
        }
        Insert: {
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id: string
          service_order_id: string
          status: string
        }
        Update: {
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string
          service_order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_validations_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          active: boolean | null
          created_at: string | null
          department_id: string | null
          id: string
          name: string
          permission_level: string | null
          region_id: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          name: string
          permission_level?: string | null
          region_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          name?: string
          permission_level?: string | null
          region_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      technicians: {
        Row: {
          active: boolean | null
          created_at: string | null
          department_id: string | null
          function: string | null
          id: string
          name: string
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          department_id?: string | null
          function?: string | null
          id?: string
          name: string
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          department_id?: string | null
          function?: string | null
          id?: string
          name?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
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
      can_message: {
        Args: { _receiver: string; _sender: string }
        Returns: boolean
      }
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
      is_conversation_participant: {
        Args: { _conv: string; _user: string }
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
      os_audit_status:
        | "nao_auditada"
        | "pendente_auditoria"
        | "em_auditoria"
        | "aprovada_na_auditoria"
        | "reprovada_na_auditoria"
        | "com_ressalva"
        | "com_inconsistencia"
        | "em_investigacao"
        | "aguardando_resposta"
        | "corrigida_apos_auditoria"
        | "encerrada"
      os_financial_status:
        | "sem_impacto"
        | "aguardando_analise"
        | "em_analise"
        | "aprovada_financeiramente"
        | "reprovada_financeiramente"
        | "com_divergencia"
        | "aguardando_correcao_operacional"
        | "faturavel"
        | "nao_faturavel"
        | "aguardando_faturamento"
        | "faturada"
        | "cancelada_financeiramente"
        | "em_auditoria_financeira"
      os_operational_status:
        | "pendente"
        | "atribuida"
        | "em_deslocamento"
        | "chegou_ao_local"
        | "em_execucao"
        | "execucao_pausada"
        | "nao_executada"
        | "aguardando_validacao"
        | "correcao_solicitada"
        | "reaberta"
        | "reprovada"
        | "aprovada"
        | "concluida"
        | "cancelada"
        | "critica"
        | "em_auditoria"
        | "aguardando_excecao"
        | "excecao_aprovada"
        | "excecao_negada"
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
      os_audit_status: [
        "nao_auditada",
        "pendente_auditoria",
        "em_auditoria",
        "aprovada_na_auditoria",
        "reprovada_na_auditoria",
        "com_ressalva",
        "com_inconsistencia",
        "em_investigacao",
        "aguardando_resposta",
        "corrigida_apos_auditoria",
        "encerrada",
      ],
      os_financial_status: [
        "sem_impacto",
        "aguardando_analise",
        "em_analise",
        "aprovada_financeiramente",
        "reprovada_financeiramente",
        "com_divergencia",
        "aguardando_correcao_operacional",
        "faturavel",
        "nao_faturavel",
        "aguardando_faturamento",
        "faturada",
        "cancelada_financeiramente",
        "em_auditoria_financeira",
      ],
      os_operational_status: [
        "pendente",
        "atribuida",
        "em_deslocamento",
        "chegou_ao_local",
        "em_execucao",
        "execucao_pausada",
        "nao_executada",
        "aguardando_validacao",
        "correcao_solicitada",
        "reaberta",
        "reprovada",
        "aprovada",
        "concluida",
        "cancelada",
        "critica",
        "em_auditoria",
        "aguardando_excecao",
        "excecao_aprovada",
        "excecao_negada",
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
