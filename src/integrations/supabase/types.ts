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
      ai_analysis_logs: {
        Row: {
          analysis_type: string | null
          created_at: string | null
          id: string
          input_snapshot: Json | null
          output_result: string | null
          provider: string | null
          requested_by: string | null
          service_order_id: string | null
        }
        Insert: {
          analysis_type?: string | null
          created_at?: string | null
          id?: string
          input_snapshot?: Json | null
          output_result?: string | null
          provider?: string | null
          requested_by?: string | null
          service_order_id?: string | null
        }
        Update: {
          analysis_type?: string | null
          created_at?: string | null
          id?: string
          input_snapshot?: Json | null
          output_result?: string | null
          provider?: string | null
          requested_by?: string | null
          service_order_id?: string | null
        }
        Relationships: []
      }
      api_integrations: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          environment: string | null
          id: string
          integration_type: string
          last_error_at: string | null
          last_error_message: string | null
          last_success_at: string | null
          name: string
          provider: string
          public_config: Json | null
          secret_config_reference: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          environment?: string | null
          id?: string
          integration_type: string
          last_error_at?: string | null
          last_error_message?: string | null
          last_success_at?: string | null
          name: string
          provider: string
          public_config?: Json | null
          secret_config_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          environment?: string | null
          id?: string
          integration_type?: string
          last_error_at?: string | null
          last_error_message?: string | null
          last_success_at?: string | null
          name?: string
          provider?: string
          public_config?: Json | null
          secret_config_reference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          error_message: string | null
          id: string
          integration_type: string
          method: string | null
          provider: string
          related_entity_id: string | null
          related_entity_type: string | null
          status_code: number | null
          success: boolean | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          integration_type: string
          method?: string | null
          provider: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status_code?: number | null
          success?: boolean | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          integration_type?: string
          method?: string | null
          provider?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          status_code?: number | null
          success?: boolean | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      atividades: {
        Row: {
          anexos: string[] | null
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
          anexos?: string[] | null
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
          anexos?: string[] | null
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
          servico_id: string | null
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
          servico_id?: string | null
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
          servico_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          ultima_leitura: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          ultima_leitura?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
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
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          obra_id: string | null
          tipo: string
          titulo: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          obra_id?: string | null
          tipo?: string
          titulo?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          obra_id?: string | null
          tipo?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          acronym: string | null
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          acronym?: string | null
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          acronym?: string | null
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      design_system_presets: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          settings_json: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          settings_json: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          settings_json?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      design_system_settings: {
        Row: {
          accent_color: string | null
          app_icon_url: string | null
          background_color: string | null
          border_color: string | null
          button_radius: string | null
          card_radius: string | null
          created_at: string | null
          custom_css: string | null
          danger_color: string | null
          favicon_url: string | null
          font_body: string | null
          font_buttons: string | null
          font_heading: string | null
          id: string
          info_color: string | null
          input_radius: string | null
          is_active: boolean | null
          login_background_url: string | null
          logo_url: string | null
          muted_text_color: string | null
          primary_color: string | null
          secondary_color: string | null
          sidebar_style: string | null
          success_color: string | null
          surface_color: string | null
          text_color: string | null
          theme_mode: string | null
          updated_at: string | null
          updated_by: string | null
          warning_color: string | null
        }
        Insert: {
          accent_color?: string | null
          app_icon_url?: string | null
          background_color?: string | null
          border_color?: string | null
          button_radius?: string | null
          card_radius?: string | null
          created_at?: string | null
          custom_css?: string | null
          danger_color?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_buttons?: string | null
          font_heading?: string | null
          id?: string
          info_color?: string | null
          input_radius?: string | null
          is_active?: boolean | null
          login_background_url?: string | null
          logo_url?: string | null
          muted_text_color?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sidebar_style?: string | null
          success_color?: string | null
          surface_color?: string | null
          text_color?: string | null
          theme_mode?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warning_color?: string | null
        }
        Update: {
          accent_color?: string | null
          app_icon_url?: string | null
          background_color?: string | null
          border_color?: string | null
          button_radius?: string | null
          card_radius?: string | null
          created_at?: string | null
          custom_css?: string | null
          danger_color?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_buttons?: string | null
          font_heading?: string | null
          id?: string
          info_color?: string | null
          input_radius?: string | null
          is_active?: boolean | null
          login_background_url?: string | null
          logo_url?: string | null
          muted_text_color?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sidebar_style?: string | null
          success_color?: string | null
          surface_color?: string | null
          text_color?: string | null
          theme_mode?: string | null
          updated_at?: string | null
          updated_by?: string | null
          warning_color?: string | null
        }
        Relationships: []
      }
      developer_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          module: string
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module: string
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      developer_files: {
        Row: {
          created_at: string | null
          file_category: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_public: boolean | null
          storage_bucket: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_category: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_public?: boolean | null
          storage_bucket: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_category?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_public?: boolean | null
          storage_bucket?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      developer_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          provider: string | null
          recipient: string
          sent_at: string | null
          status: string | null
          subject: string | null
          template: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string | null
          recipient: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_audit_logs: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          company_id: string
          employee_id: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          company_id: string
          employee_id: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          company_id?: string
          employee_id?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_audit_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          access_level: string | null
          admission_date: string | null
          can_access_system: boolean | null
          can_close_service_orders: boolean | null
          can_manage_materials: boolean | null
          can_receive_service_orders: boolean | null
          can_view_financial_data: boolean | null
          can_view_reports: boolean | null
          company_id: string
          created_at: string | null
          department_id: string | null
          department_name: string | null
          document_cpf: string | null
          email: string | null
          employee_type: string | null
          full_name: string
          id: string
          internal_company_code: string | null
          is_active: boolean | null
          job_title: string | null
          notes: string | null
          operational_role: string | null
          phone: string | null
          photo_url: string | null
          service_code: string | null
          status: string | null
          termination_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_level?: string | null
          admission_date?: string | null
          can_access_system?: boolean | null
          can_close_service_orders?: boolean | null
          can_manage_materials?: boolean | null
          can_receive_service_orders?: boolean | null
          can_view_financial_data?: boolean | null
          can_view_reports?: boolean | null
          company_id?: string
          created_at?: string | null
          department_id?: string | null
          department_name?: string | null
          document_cpf?: string | null
          email?: string | null
          employee_type?: string | null
          full_name: string
          id?: string
          internal_company_code?: string | null
          is_active?: boolean | null
          job_title?: string | null
          notes?: string | null
          operational_role?: string | null
          phone?: string | null
          photo_url?: string | null
          service_code?: string | null
          status?: string | null
          termination_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_level?: string | null
          admission_date?: string | null
          can_access_system?: boolean | null
          can_close_service_orders?: boolean | null
          can_manage_materials?: boolean | null
          can_receive_service_orders?: boolean | null
          can_view_financial_data?: boolean | null
          can_view_reports?: boolean | null
          company_id?: string
          created_at?: string | null
          department_id?: string | null
          department_name?: string | null
          document_cpf?: string | null
          email?: string | null
          employee_type?: string | null
          full_name?: string
          id?: string
          internal_company_code?: string | null
          is_active?: boolean | null
          job_title?: string | null
          notes?: string | null
          operational_role?: string | null
          phone?: string | null
          photo_url?: string | null
          service_code?: string | null
          status?: string | null
          termination_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
      geocoding_cache: {
        Row: {
          created_at: string | null
          formatted_address: string | null
          id: string
          latitude: number | null
          longitude: number | null
          provider: string | null
          query: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider?: string | null
          query: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          formatted_address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          provider?: string | null
          query?: string
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
      material_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      material_reservations: {
        Row: {
          consumed_at: string | null
          created_at: string
          created_by: string
          id: string
          material_id: string
          os_id: string
          quantity: number
          released_at: string | null
          status: string
          warehouse_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          material_id: string
          os_id: string
          quantity: number
          released_at?: string | null
          status?: string
          warehouse_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          material_id?: string
          os_id?: string
          quantity?: number
          released_at?: string | null
          status?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_reservations_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_reservations_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_reservations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          active: boolean | null
          category_id: string | null
          code: string
          cost_price: number
          created_at: string
          critical_stock: number
          description: string | null
          id: string
          is_serial_tracked: boolean | null
          minimum_stock: number
          name: string
          photo_url: string | null
          sale_price: number
          unit: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          code: string
          cost_price?: number
          created_at?: string
          critical_stock?: number
          description?: string | null
          id?: string
          is_serial_tracked?: boolean | null
          minimum_stock?: number
          name: string
          photo_url?: string | null
          sale_price?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          code?: string
          cost_price?: number
          created_at?: string
          critical_stock?: number
          description?: string | null
          id?: string
          is_serial_tracked?: boolean | null
          minimum_stock?: number
          name?: string
          photo_url?: string | null
          sale_price?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_status: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_status_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          delivered_at: string | null
          id: string
          is_archived: boolean | null
          sender_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          anexo_tipo?: string | null
          anexo_url?: string | null
          conteudo?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_archived?: boolean | null
          sender_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          anexo_tipo?: string | null
          anexo_url?: string | null
          conteudo?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_archived?: boolean | null
          sender_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          address: string | null
          aprovado_em: string | null
          aprovado_por: string | null
          archived_at: string | null
          arquivada: boolean | null
          assigned_manager_id: string | null
          assigned_supervisor_id: string | null
          audit_status: Database["public"]["Enums"]["os_audit_status"] | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          created_by: string | null
          criticality_level: string | null
          data_agendada: string | null
          department_id: string | null
          due_at: string | null
          endereco: string | null
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
          gestor_responsavel_id: string | null
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
          ponto_referencia: string | null
          prioridade: string | null
          profissional_id: string
          region_id: string | null
          servico_id: string | null
          solicitante_nome: string | null
          solicitante_telefone: string | null
          status: Database["public"]["Enums"]["os_status"]
          status_financeiro: string | null
          status_workflow: string | null
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
          address?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          archived_at?: string | null
          arquivada?: boolean | null
          assigned_manager_id?: string | null
          assigned_supervisor_id?: string | null
          audit_status?: Database["public"]["Enums"]["os_audit_status"] | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          criticality_level?: string | null
          data_agendada?: string | null
          department_id?: string | null
          due_at?: string | null
          endereco?: string | null
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
          gestor_responsavel_id?: string | null
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
          ponto_referencia?: string | null
          prioridade?: string | null
          profissional_id: string
          region_id?: string | null
          servico_id?: string | null
          solicitante_nome?: string | null
          solicitante_telefone?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          status_financeiro?: string | null
          status_workflow?: string | null
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
          address?: string | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          archived_at?: string | null
          arquivada?: boolean | null
          assigned_manager_id?: string | null
          assigned_supervisor_id?: string | null
          audit_status?: Database["public"]["Enums"]["os_audit_status"] | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          created_by?: string | null
          criticality_level?: string | null
          data_agendada?: string | null
          department_id?: string | null
          due_at?: string | null
          endereco?: string | null
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
          gestor_responsavel_id?: string | null
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
          ponto_referencia?: string | null
          prioridade?: string | null
          profissional_id?: string
          region_id?: string | null
          servico_id?: string | null
          solicitante_nome?: string | null
          solicitante_telefone?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          status_financeiro?: string | null
          status_workflow?: string | null
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
            foreignKeyName: "ordens_servico_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
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
            foreignKeyName: "ordens_servico_gestor_responsavel_id_fkey"
            columns: ["gestor_responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "ordens_servico_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
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
      os_approvals: {
        Row: {
          approver_id: string
          comments: string | null
          created_at: string | null
          id: string
          os_id: string
          status: string
        }
        Insert: {
          approver_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          os_id: string
          status: string
        }
        Update: {
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          os_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_approvals_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
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
      os_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          os_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          os_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          os_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_comments_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      os_evidences: {
        Row: {
          audit_verified: boolean | null
          created_at: string | null
          deleted_at: string | null
          id: string
          localizacao: Json | null
          metadata: Json | null
          os_id: string | null
          tipo: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          audit_verified?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          localizacao?: Json | null
          metadata?: Json | null
          os_id?: string | null
          tipo?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          audit_verified?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
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
      os_history: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          new_status: string | null
          old_status: string | null
          os_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          os_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          os_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_history_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      os_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          os_id: string | null
          quantity_planned: number
          quantity_used: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          os_id?: string | null
          quantity_planned?: number
          quantity_used?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          os_id?: string | null
          quantity_planned?: number
          quantity_used?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "os_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_materials_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      os_materials_request: {
        Row: {
          created_at: string | null
          id: string
          material_id: string
          os_id: string
          quantity_delivered: number | null
          quantity_requested: number
          requested_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id: string
          os_id: string
          quantity_delivered?: number | null
          quantity_requested: number
          requested_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string
          os_id?: string
          quantity_delivered?: number | null
          quantity_requested?: number
          requested_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_materials_request_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_materials_request_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_materials_request_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      os_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          os_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          os_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          os_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_messages_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      os_status_history: {
        Row: {
          created_at: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          os_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          os_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          os_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_status_history_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_status_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          created_at: string | null
          force_password_change: boolean | null
          id: string
          requested_by: string
          status: string | null
          target_user_id: string
          temporary_password_created: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          force_password_change?: boolean | null
          id?: string
          requested_by: string
          status?: string | null
          target_user_id: string
          temporary_password_created?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          force_password_change?: boolean | null
          id?: string
          requested_by?: string
          status?: string | null
          target_user_id?: string
          temporary_password_created?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      payment_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          external_id: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          provider: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          provider: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          external_id?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          provider?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          expires_at: string | null
          external_payment_id: string | null
          id: string
          paid_at: string | null
          payment_link: string | null
          payment_method: string | null
          plan_id: string | null
          provider: string | null
          qr_code: string | null
          qr_code_base64: string | null
          service_order_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          expires_at?: string | null
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          plan_id?: string | null
          provider?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          service_order_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          expires_at?: string | null
          external_payment_id?: string | null
          id?: string
          paid_at?: string | null
          payment_link?: string | null
          payment_method?: string | null
          plan_id?: string | null
          provider?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          service_order_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          bairro: string | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          department_id: string | null
          documento: string | null
          email: string
          endereco_residencial: string | null
          especialidade: string | null
          estado: string | null
          foto_url: string | null
          id: string
          manager_id: string | null
          must_change_password: boolean
          nome: string
          rg: string | null
          role: string | null
          supervisor_id: string | null
          team_id: string | null
          telefone: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          ultimo_acesso: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          department_id?: string | null
          documento?: string | null
          email: string
          endereco_residencial?: string | null
          especialidade?: string | null
          estado?: string | null
          foto_url?: string | null
          id: string
          manager_id?: string | null
          must_change_password?: boolean
          nome: string
          rg?: string | null
          role?: string | null
          supervisor_id?: string | null
          team_id?: string | null
          telefone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          ultimo_acesso?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          department_id?: string | null
          documento?: string | null
          email?: string
          endereco_residencial?: string | null
          especialidade?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          manager_id?: string | null
          must_change_password?: boolean
          nome?: string
          rg?: string | null
          role?: string | null
          supervisor_id?: string | null
          team_id?: string | null
          telefone?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
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
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          file_url: string | null
          filters: Json | null
          id: string
          report_type: string
          requested_by: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          file_url?: string | null
          filters?: Json | null
          id?: string
          report_type: string
          requested_by?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          file_url?: string | null
          filters?: Json | null
          id?: string
          report_type?: string
          requested_by?: string | null
          status?: string | null
        }
        Relationships: []
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
      service_order_employees: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          created_at: string | null
          employee_id: string
          employee_internal_code: string
          employee_service_code: string
          id: string
          paused_at: string | null
          role_in_service: string | null
          service_order_id: string
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          employee_id: string
          employee_internal_code: string
          employee_service_code: string
          id?: string
          paused_at?: string | null
          role_in_service?: string | null
          service_order_id: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string
          employee_internal_code?: string
          employee_service_code?: string
          id?: string
          paused_at?: string | null
          role_in_service?: string | null
          service_order_id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_employees_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_history: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          details: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          new_status: string | null
          previous_status: string | null
          service_order_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          new_status?: string | null
          previous_status?: string | null
          service_order_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
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
          category: string | null
          created_at: string | null
          description: string | null
          execution_record_id: string | null
          file_name: string | null
          file_size: number | null
          id: string
          lat: number | null
          lng: number | null
          media_type: string
          media_url: string
          service_order_id: string
          user_id: string
        }
        Insert: {
          captured_at?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          execution_record_id?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          media_type: string
          media_url: string
          service_order_id: string
          user_id: string
        }
        Update: {
          captured_at?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          execution_record_id?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          media_type?: string
          media_url?: string
          service_order_id?: string
          user_id?: string
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
      service_orders: {
        Row: {
          address: string | null
          audit_status: string
          cliente_id: string | null
          created_at: string | null
          department_id: string | null
          descricao: string | null
          financial_status: string
          finished_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          manager_id: string | null
          numero: number
          obra_id: string | null
          priority: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          supervisor_id: string | null
          team_id: string | null
          technician_id: string | null
          titulo: string
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          audit_status?: string
          cliente_id?: string | null
          created_at?: string | null
          department_id?: string | null
          descricao?: string | null
          financial_status?: string
          finished_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          numero?: number
          obra_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          supervisor_id?: string | null
          team_id?: string | null
          technician_id?: string | null
          titulo: string
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          audit_status?: string
          cliente_id?: string | null
          created_at?: string | null
          department_id?: string | null
          descricao?: string | null
          financial_status?: string
          finished_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          numero?: number
          obra_id?: string | null
          priority?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          supervisor_id?: string | null
          team_id?: string | null
          technician_id?: string | null
          titulo?: string
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          material_id: string | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          warehouse_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          material_id?: string | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          warehouse_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          material_id?: string | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          id: string
          last_updated_at: string
          material_id: string | null
          quantity: number
          reserved_quantity: number
          warehouse_id: string | null
        }
        Insert: {
          id?: string
          last_updated_at?: string
          material_id?: string | null
          quantity?: number
          reserved_quantity?: number
          warehouse_id?: string | null
        }
        Update: {
          id?: string
          last_updated_at?: string
          material_id?: string | null
          quantity?: number
          reserved_quantity?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_number: string | null
          created_at: string
          created_by: string
          from_warehouse_id: string | null
          id: string
          invoice_number: string | null
          material_id: string
          notes: string | null
          os_id: string | null
          parent_movement_id: string | null
          professional_id: string | null
          quantity: number
          reason: string | null
          status: string | null
          supplier: string | null
          to_warehouse_id: string | null
          total_cost: number | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost: number | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          created_by: string
          from_warehouse_id?: string | null
          id?: string
          invoice_number?: string | null
          material_id: string
          notes?: string | null
          os_id?: string | null
          parent_movement_id?: string | null
          professional_id?: string | null
          quantity: number
          reason?: string | null
          status?: string | null
          supplier?: string | null
          to_warehouse_id?: string | null
          total_cost?: number | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost?: number | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          created_by?: string
          from_warehouse_id?: string | null
          id?: string
          invoice_number?: string | null
          material_id?: string
          notes?: string | null
          os_id?: string | null
          parent_movement_id?: string | null
          professional_id?: string | null
          quantity?: number
          reason?: string | null
          status?: string | null
          supplier?: string | null
          to_warehouse_id?: string | null
          total_cost?: number | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_parent_movement_id_fkey"
            columns: ["parent_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
      system_backups: {
        Row: {
          config_type: string
          created_at: string
          created_by: string | null
          data: Json
          id: string
          name: string
        }
        Insert: {
          config_type: string
          created_at?: string
          created_by?: string | null
          data: Json
          id?: string
          name: string
        }
        Update: {
          config_type?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      system_error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          route: string | null
          severity: string
          source: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity?: string
          source?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity?: string
          source?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_maintenance: {
        Row: {
          allowed_roles: string[] | null
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          is_maintenance_mode: boolean | null
          message: string | null
          starts_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_maintenance_mode?: boolean | null
          message?: string | null
          starts_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_maintenance_mode?: boolean | null
          message?: string | null
          starts_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
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
      teams: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          name: string
          supervisor_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          name: string
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          name?: string
          supervisor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
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
      user_push_tokens: {
        Row: {
          active: boolean | null
          browser: string | null
          created_at: string | null
          device_info: Json | null
          id: string
          platform: string | null
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          browser?: string | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          platform?: string | null
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          browser?: string | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          platform?: string | null
          token?: string
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
      warehouses: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          is_mobile: boolean | null
          location: string | null
          name: string
          responsible_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          is_mobile?: boolean | null
          location?: string | null
          name: string
          responsible_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          is_mobile?: boolean | null
          location?: string | null
          name?: string
          responsible_id?: string | null
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string | null
          id: string
          message_type: string | null
          provider_response: Json | null
          recipient_phone: string
          sent_at: string | null
          service_order_id: string | null
          status: string | null
          template_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_type?: string | null
          provider_response?: Json | null
          recipient_phone: string
          sent_at?: string | null
          service_order_id?: string | null
          status?: string | null
          template_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_type?: string | null
          provider_response?: Json | null
          recipient_phone?: string
          sent_at?: string | null
          service_order_id?: string | null
          status?: string | null
          template_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_messages: { Args: never; Returns: undefined }
      can_message: {
        Args: { _receiver: string; _sender: string }
        Returns: boolean
      }
      check_os_access: {
        Args: { os_row: Database["public"]["Tables"]["ordens_servico"]["Row"] }
        Returns: boolean
      }
      execute_dev_sql: { Args: { sql_query: string }; Returns: Json }
      get_conversation_between_users: {
        Args: { user1: string; user2: string }
        Returns: {
          conversation_id: string
        }[]
      }
      get_or_create_department_conversation: {
        Args: { _department_id: string }
        Returns: string
      }
      get_users_without_roles: {
        Args: never
        Returns: {
          id: string
        }[]
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
      is_developer: { Args: never; Returns: boolean }
      log_developer_action: {
        Args: {
          p_action: string
          p_details: Json
          p_ip?: string
          p_module: string
        }
        Returns: undefined
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
        | "estoque"
        | "developer"
      audit_status:
        | "Não auditada"
        | "Pendente de auditoria"
        | "Em auditoria"
        | "Aprovada na auditoria"
        | "Reprovada na auditoria"
        | "Com ressalva"
        | "Com inconsistência"
        | "Em investigação"
        | "Aguardando resposta"
        | "Corrigida após auditoria"
        | "Encerrada"
      financial_status:
        | "Sem impacto financeiro"
        | "Aguardando análise financeira"
        | "Em análise financeira"
        | "Aprovada financeiramente"
        | "Reprovada financeiramente"
        | "Com divergência"
        | "Aguardando correção operacional"
        | "Faturável"
        | "Não faturável"
        | "Aguardando faturamento"
        | "Faturada"
        | "Cancelada financeiramente"
        | "Em auditoria financeira"
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
      operational_status:
        | "Pendente"
        | "Atribuída"
        | "Em deslocamento"
        | "Chegou ao local"
        | "Em execução"
        | "Execução pausada"
        | "Não executada"
        | "Aguardando validação"
        | "Correção solicitada"
        | "Reaberta"
        | "Reprovada"
        | "Aprovada"
        | "Concluída"
        | "Cancelada"
        | "Crítica"
        | "Em auditoria"
        | "Aguardando exceção"
        | "Exceção aprovada"
        | "Exceção negada"
        | "Iniciada"
        | "Lançada"
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
        | "iniciada"
        | "lancada"
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
      stock_movement_type:
        | "entrada"
        | "saida"
        | "transferencia"
        | "ajuste"
        | "devolucao"
        | "reserva"
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
        "estoque",
        "developer",
      ],
      audit_status: [
        "Não auditada",
        "Pendente de auditoria",
        "Em auditoria",
        "Aprovada na auditoria",
        "Reprovada na auditoria",
        "Com ressalva",
        "Com inconsistência",
        "Em investigação",
        "Aguardando resposta",
        "Corrigida após auditoria",
        "Encerrada",
      ],
      financial_status: [
        "Sem impacto financeiro",
        "Aguardando análise financeira",
        "Em análise financeira",
        "Aprovada financeiramente",
        "Reprovada financeiramente",
        "Com divergência",
        "Aguardando correção operacional",
        "Faturável",
        "Não faturável",
        "Aguardando faturamento",
        "Faturada",
        "Cancelada financeiramente",
        "Em auditoria financeira",
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
      operational_status: [
        "Pendente",
        "Atribuída",
        "Em deslocamento",
        "Chegou ao local",
        "Em execução",
        "Execução pausada",
        "Não executada",
        "Aguardando validação",
        "Correção solicitada",
        "Reaberta",
        "Reprovada",
        "Aprovada",
        "Concluída",
        "Cancelada",
        "Crítica",
        "Em auditoria",
        "Aguardando exceção",
        "Exceção aprovada",
        "Exceção negada",
        "Iniciada",
        "Lançada",
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
        "iniciada",
        "lancada",
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
      stock_movement_type: [
        "entrada",
        "saida",
        "transferencia",
        "ajuste",
        "devolucao",
        "reserva",
      ],
    },
  },
} as const
