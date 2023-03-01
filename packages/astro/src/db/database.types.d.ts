export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      checklist_category: {
        Row: {
          description: string | null
          id: number
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
        }
      }
      checklist_types: {
        Row: {
          checklist_category_id: number | null
          description: string
          id: number
          name: string
          visibility: boolean
        }
        Insert: {
          checklist_category_id?: number | null
          description: string
          id?: number
          name: string
          visibility: boolean
        }
        Update: {
          checklist_category_id?: number | null
          description?: string
          id?: number
          name?: string
          visibility?: boolean
        }
      }
      checklists_kb: {
        Row: {
          add_resources: string | null
          checklist_id: string
          checklist_type: number
          content: string | null
          id: number
          kb_id: number | null
          maturity: number | null
          question_id: number | null
        }
        Insert: {
          add_resources?: string | null
          checklist_id: string
          checklist_type: number
          content?: string | null
          id?: number
          kb_id?: number | null
          maturity?: number | null
          question_id?: number | null
        }
        Update: {
          add_resources?: string | null
          checklist_id?: string
          checklist_type?: number
          content?: string | null
          id?: number
          kb_id?: number | null
          maturity?: number | null
          question_id?: number | null
        }
      }
      checklists_results: {
        Row: {
          checklist_id: number | null
          checklist_type_id: number | null
          evidence: string | null
          id: number
          kb_id: number | null
          project_id: number | null
          resolved: boolean | null
          sprint_id: number | null
          status: number | null
        }
        Insert: {
          checklist_id?: number | null
          checklist_type_id?: number | null
          evidence?: string | null
          id?: number
          kb_id?: number | null
          project_id?: number | null
          resolved?: boolean | null
          sprint_id?: number | null
          status?: number | null
        }
        Update: {
          checklist_id?: number | null
          checklist_type_id?: number | null
          evidence?: string | null
          id?: number
          kb_id?: number | null
          project_id?: number | null
          resolved?: boolean | null
          sprint_id?: number | null
          status?: number | null
        }
      }
      code_items: {
        Row: {
          checklist_category_id: number | null
          code_lang: string
          content: string
          id: number
          title: string
        }
        Insert: {
          checklist_category_id?: number | null
          code_lang: string
          content: string
          id?: number
          title: string
        }
        Update: {
          checklist_category_id?: number | null
          code_lang?: string
          content?: string
          id?: number
          title?: string
        }
      }
      groupmembers: {
        Row: {
          group_id: number | null
          user_id: number | null
        }
        Insert: {
          group_id?: number | null
          user_id?: number | null
        }
        Update: {
          group_id?: number | null
          user_id?: number | null
        }
      }
      groups: {
        Row: {
          groupName: string
          id: number
          owner_id: number
          timestamp: string | null
        }
        Insert: {
          groupName: string
          id?: number
          owner_id: number
          timestamp?: string | null
        }
        Update: {
          groupName?: string
          id?: number
          owner_id?: number
          timestamp?: string | null
        }
      }
      kb_items: {
        Row: {
          checklist_category_id: number | null
          content: string | null
          kb_id: number
          title: string | null
        }
        Insert: {
          checklist_category_id?: number | null
          content?: string | null
          kb_id?: number
          title?: string | null
        }
        Update: {
          checklist_category_id?: number | null
          content?: string | null
          kb_id?: number
          title?: string | null
        }
      }
      lab_items: {
        Row: {
          has_hints: boolean | null
          id: number
          image_tag: string
          label: string
          level: number
          link: string
          title: string
        }
        Insert: {
          has_hints?: boolean | null
          id?: number
          image_tag: string
          label: string
          level: number
          link: string
          title: string
        }
        Update: {
          has_hints?: boolean | null
          id?: number
          image_tag?: string
          label?: string
          level?: number
          link?: string
          title?: string
        }
      }
      lab_items_code: {
        Row: {
          code_example: string
          code_type: string
          hint: string
          id: number
          solution: number
        }
        Insert: {
          code_example: string
          code_type: string
          hint: string
          id?: number
          solution: number
        }
        Update: {
          code_example?: string
          code_type?: string
          hint?: string
          id?: number
          solution?: number
        }
      }
      lab_items_code_options: {
        Row: {
          id: number
          vuln: string
        }
        Insert: {
          id?: number
          vuln: string
        }
        Update: {
          id?: number
          vuln?: string
        }
      }
      labs: {
        Row: {
          description: string | null
          id: number
          level: number | null
          name: string | null
        }
        Insert: {
          description?: string | null
          id: number
          level?: number | null
          name?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          level?: number | null
          name?: string | null
        }
      }
      logs: {
        Row: {
          date: number
          id: number
          ip: string
          message: string
          status: string
          threat: string
          time: number
          user_id: number
        }
        Insert: {
          date: number
          id?: number
          ip: string
          message: string
          status: string
          threat: string
          time: number
          user_id: number
        }
        Update: {
          date?: number
          id?: number
          ip?: string
          message?: string
          status?: string
          threat?: string
          time?: number
          user_id?: number
        }
      }
      privileges: {
        Row: {
          id: number
          privilege: string
        }
        Insert: {
          id?: number
          privilege: string
        }
        Update: {
          id?: number
          privilege?: string
        }
      }
      profile: {
        Row: {
          id: number
          labs_progress: Json
          user_id: string
        }
        Insert: {
          id?: number
          labs_progress?: Json
          user_id: string
        }
        Update: {
          id?: number
          labs_progress?: Json
          user_id?: string
        }
      }
      project_sprints: {
        Row: {
          checklist_type_id: number | null
          description: string | null
          group_id: number | null
          name: string | null
          project_id: number | null
          sprint_id: number
        }
        Insert: {
          checklist_type_id?: number | null
          description?: string | null
          group_id?: number | null
          name?: string | null
          project_id?: number | null
          sprint_id?: number
        }
        Update: {
          checklist_type_id?: number | null
          description?: string | null
          group_id?: number | null
          name?: string | null
          project_id?: number | null
          sprint_id?: number
        }
      }
      projects: {
        Row: {
          description: string
          id: number
          name: string
          timestamp: string
          version: string
        }
        Insert: {
          description: string
          id?: number
          name: string
          timestamp: string
          version: string
        }
        Update: {
          description?: string
          id?: number
          name?: string
          timestamp?: string
          version?: string
        }
      }
      question_results: {
        Row: {
          checklist_type: number | null
          id: number
          project_id: number | null
          question_id: number | null
          result: string | null
          sprint_id: number | null
        }
        Insert: {
          checklist_type?: number | null
          id?: number
          project_id?: number | null
          question_id?: number | null
          result?: string | null
          sprint_id?: number | null
        }
        Update: {
          checklist_type?: number | null
          id?: number
          project_id?: number | null
          question_id?: number | null
          result?: string | null
          sprint_id?: number | null
        }
      }
      questions: {
        Row: {
          checklist_type: number
          id: number
          question: string
        }
        Insert: {
          checklist_type: number
          id?: number
          question: string
        }
        Update: {
          checklist_type?: number
          id?: number
          question?: string
        }
      }
      training: {
        Row: {
          category_id: string
          course_id: string
          user_id: string
        }
        Insert: {
          category_id: string
          course_id: string
          user_id: string
        }
        Update: {
          category_id?: string
          course_id?: string
          user_id?: string
        }
      }
      users: {
        Row: {
          access: boolean
          accessToken: number
          activated: boolean
          email: string
          id: number
          password: string | null
          privilege_id: number
          username: string | null
        }
        Insert: {
          access: boolean
          accessToken: number
          activated: boolean
          email: string
          id?: number
          password?: string | null
          privilege_id: number
          username?: string | null
        }
        Update: {
          access?: boolean
          accessToken?: number
          activated?: boolean
          email?: string
          id?: number
          password?: string | null
          privilege_id?: number
          username?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_labs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      hello: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      install_available_extensions_and_test: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
