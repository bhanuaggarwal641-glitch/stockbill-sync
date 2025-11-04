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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value_json: Json | null
          old_value_json: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value_json?: Json | null
          old_value_json?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value_json?: Json | null
          old_value_json?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      credit_ledgers: {
        Row: {
          balance_amount: number
          created_at: string
          due_date: string | null
          id: string
          invoice_id: string
          invoice_type: string
          paid_amount: number
          party_id: string
          party_type: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance_amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_id: string
          invoice_type: string
          paid_amount?: number
          party_id: string
          party_type: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          balance_amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_id?: string
          invoice_type?: string
          paid_amount?: number
          party_id?: string
          party_type?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          default_gst_rate: number | null
          description: string | null
          gst_applicability: Database["public"]["Enums"]["gst_applicability"]
          id: string
          image_url: string | null
          name: string
          price: number
          quantity_in_stock: number
          reorder_level: number | null
          size: string | null
          sku: string
          thickness: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          default_gst_rate?: number | null
          description?: string | null
          gst_applicability?: Database["public"]["Enums"]["gst_applicability"]
          id?: string
          image_url?: string | null
          name: string
          price?: number
          quantity_in_stock?: number
          reorder_level?: number | null
          size?: string | null
          sku: string
          thickness?: string | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          default_gst_rate?: number | null
          description?: string | null
          gst_applicability?: Database["public"]["Enums"]["gst_applicability"]
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          quantity_in_stock?: number
          reorder_level?: number | null
          size?: string | null
          sku?: string
          thickness?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      purchase_invoices: {
        Row: {
          created_at: string
          created_by_user_id: string
          grand_total: number
          gst_total: number
          id: string
          is_gst: boolean
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          purchase_date: string
          purchase_number: string
          sub_total: number
          supplier_id: string
          supplier_invoice_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          grand_total?: number
          gst_total?: number
          id?: string
          is_gst?: boolean
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          purchase_date?: string
          purchase_number: string
          sub_total?: number
          supplier_id: string
          supplier_invoice_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          grand_total?: number
          gst_total?: number
          id?: string
          is_gst?: boolean
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          purchase_date?: string
          purchase_number?: string
          sub_total?: number
          supplier_id?: string
          supplier_invoice_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          created_at: string
          gst_rate: number
          id: string
          line_total: number
          product_id: string
          purchase_invoice_id: string
          qty: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          gst_rate?: number
          id?: string
          line_total: number
          product_id: string
          purchase_invoice_id: string
          qty: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          gst_rate?: number
          id?: string
          line_total?: number
          product_id?: string
          purchase_invoice_id?: string
          qty?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          created_at: string
          created_by_user_id: string
          customer_id: string | null
          grand_total: number
          gst_total: number
          id: string
          invoice_date: string
          invoice_number: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          round_off: number
          sub_total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          created_by_user_id: string
          customer_id?: string | null
          grand_total?: number
          gst_total?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          round_off?: number
          sub_total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          created_at?: string
          created_by_user_id?: string
          customer_id?: string | null
          grand_total?: number
          gst_total?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          round_off?: number
          sub_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_items: {
        Row: {
          created_at: string
          discount: number
          gst_rate: number
          id: string
          is_tax_inclusive: boolean
          line_total: number
          product_id: string
          qty: number
          sales_invoice_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount?: number
          gst_rate?: number
          id?: string
          is_tax_inclusive?: boolean
          line_total: number
          product_id: string
          qty: number
          sales_invoice_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          discount?: number
          gst_rate?: number
          id?: string
          is_tax_inclusive?: boolean
          line_total?: number
          product_id?: string
          qty?: number
          sales_invoice_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          is_registered: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_registered?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_registered?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
        | "billing_user"
        | "purchase_user"
        | "inventory_user"
        | "accountant"
      gst_applicability: "GST" | "NON-GST"
      payment_mode: "Cash" | "Online" | "Credit"
      payment_status: "Paid" | "Partially Paid" | "Pending"
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
        "billing_user",
        "purchase_user",
        "inventory_user",
        "accountant",
      ],
      gst_applicability: ["GST", "NON-GST"],
      payment_mode: ["Cash", "Online", "Credit"],
      payment_status: ["Paid", "Partially Paid", "Pending"],
    },
  },
} as const
