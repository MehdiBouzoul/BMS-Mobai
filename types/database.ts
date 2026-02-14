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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      auth_tokens: {
        Row: {
          expires_at: string
          token: string
          user_id: string
        }
        Insert: {
          expires_at: string
          token: string
          user_id: string
        }
        Update: {
          expires_at?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chariots: {
        Row: {
          capacity: number | null
          code: string
          id: string
          is_active: boolean
        }
        Insert: {
          capacity?: number | null
          code: string
          id?: string
          is_active?: boolean
        }
        Update: {
          capacity?: number | null
          code?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      command_orders: {
        Row: {
          order_id: string
          reception_at: string
        }
        Insert: {
          order_id: string
          reception_at: string
        }
        Update: {
          order_id?: string
          reception_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          delivery_id: number
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_id?: number
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_id?: number
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          id: string
          last_sync_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_sync_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_sync_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          id: string
          level: number
          warehouse_id: string
        }
        Insert: {
          id?: string
          level: number
          warehouse_id: string
        }
        Update: {
          id?: string
          level?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "floors_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          floor_id: string
          id: string
          is_active: boolean
          type: Database["public"]["Enums"]["location_type"]
        }
        Insert: {
          code: string
          floor_id: string
          id?: string
          is_active?: boolean
          type: Database["public"]["Enums"]["location_type"]
        }
        Update: {
          code?: string
          floor_id?: string
          id?: string
          is_active?: boolean
          type?: Database["public"]["Enums"]["location_type"]
        }
        Relationships: [
          {
            foreignKeyName: "locations_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      map_edges: {
        Row: {
          distance_meters: number
          from_node_id: string
          id: string
          is_blocked: boolean
          to_node_id: string
        }
        Insert: {
          distance_meters: number
          from_node_id: string
          id?: string
          is_blocked?: boolean
          to_node_id: string
        }
        Update: {
          distance_meters?: number
          from_node_id?: string
          id?: string
          is_blocked?: boolean
          to_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "map_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "map_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      map_nodes: {
        Row: {
          access_point_location_id: string | null
          floor_level: number
          id: string
          is_passable: boolean
          warehouse_id: string
          x: number
          y: number
        }
        Insert: {
          access_point_location_id?: string | null
          floor_level: number
          id?: string
          is_passable?: boolean
          warehouse_id: string
          x: number
          y: number
        }
        Update: {
          access_point_location_id?: string | null
          floor_level?: number
          id?: string
          is_passable?: boolean
          warehouse_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_nodes_access_point_location_id_fkey"
            columns: ["access_point_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_nodes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      operation_tasks: {
        Row: {
          assigned_to_user_id: string | null
          chariot_id: string | null
          completed_at: string | null
          created_at: string
          delivery_id: number | null
          id: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          order_id: string | null
          planned_route_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          validated: boolean
        }
        Insert: {
          assigned_to_user_id?: string | null
          chariot_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_id?: number | null
          id?: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          order_id?: string | null
          planned_route_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          validated?: boolean
        }
        Update: {
          assigned_to_user_id?: string | null
          chariot_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_id?: number | null
          id?: string
          operation_type?: Database["public"]["Enums"]["operation_type"]
          order_id?: string | null
          planned_route_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          validated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "operation_tasks_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_tasks_chariot_id_fkey"
            columns: ["chariot_id"]
            isOneToOne: false
            referencedRelation: "chariots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_tasks_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "operation_tasks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_tasks_planned_route_id_fkey"
            columns: ["planned_route_id"]
            isOneToOne: false
            referencedRelation: "route_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          delivery_id: number | null
          id: string
          source: string
          status: Database["public"]["Enums"]["order_status"]
          type: Database["public"]["Enums"]["order_type"]
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivery_id?: number | null
          id?: string
          source: string
          status?: Database["public"]["Enums"]["order_status"]
          type: Database["public"]["Enums"]["order_type"]
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivery_id?: number | null
          id?: string
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          type?: Database["public"]["Enums"]["order_type"]
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["delivery_id"]
          },
          {
            foreignKeyName: "orders_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      picking_locations: {
        Row: {
          col: number
          location_id: string
          row: number
        }
        Insert: {
          col: number
          location_id: string
          row: number
        }
        Update: {
          col?: number
          location_id?: string
          row?: number
        }
        Relationships: [
          {
            foreignKeyName: "picking_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      route_plans: {
        Row: {
          created_at: string
          id: string
          path_nodes_json: Json
          total_distance_meters: number
        }
        Insert: {
          created_at?: string
          id?: string
          path_nodes_json?: Json
          total_distance_meters?: number
        }
        Update: {
          created_at?: string
          id?: string
          path_nodes_json?: Json
          total_distance_meters?: number
        }
        Relationships: []
      }
      skus: {
        Row: {
          id: string
          name: string
          sku_code: string
          weight_kg: number
        }
        Insert: {
          id?: string
          name: string
          sku_code: string
          weight_kg?: number
        }
        Update: {
          id?: string
          name?: string
          sku_code?: string
          weight_kg?: number
        }
        Relationships: []
      }
      stock_balances: {
        Row: {
          location_id: string
          qty: number
          sku_id: string
          version: number
        }
        Insert: {
          location_id: string
          qty?: number
          sku_id: string
          version?: number
        }
        Update: {
          location_id?: string
          qty?: number
          sku_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_balances_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_balances_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_ledger_entries: {
        Row: {
          from_location_id: string | null
          id: string
          idempotency_key: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          order_id: string | null
          qty_delta: number
          sku_id: string
          task_id: string | null
          to_location_id: string | null
          ts: string
          user_id: string | null
        }
        Insert: {
          from_location_id?: string | null
          id?: string
          idempotency_key: string
          operation_type: Database["public"]["Enums"]["operation_type"]
          order_id?: string | null
          qty_delta: number
          sku_id: string
          task_id?: string | null
          to_location_id?: string | null
          ts?: string
          user_id?: string | null
        }
        Update: {
          from_location_id?: string | null
          id?: string
          idempotency_key?: string
          operation_type?: Database["public"]["Enums"]["operation_type"]
          order_id?: string | null
          qty_delta?: number
          sku_id?: string
          task_id?: string | null
          to_location_id?: string | null
          ts?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ledger_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ledger_task"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "operation_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          area_m2: number
          is_available: boolean
          level: number
          location_id: string
          slot_code: string
        }
        Insert: {
          area_m2: number
          is_available?: boolean
          level: number
          location_id: string
          slot_code: string
        }
        Update: {
          area_m2?: number
          is_available?: boolean
          level?: number
          location_id?: string
          slot_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_queue_items: {
        Row: {
          created_at: string
          device_id: string
          id: string
          idempotency_key: string
          payload_json: Json
          status: Database["public"]["Enums"]["sync_status"]
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          idempotency_key: string
          payload_json: Json
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          idempotency_key?: string
          payload_json?: Json
          status?: Database["public"]["Enums"]["sync_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sync_queue_items_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          name: string
          email: string | null
          username: string
          password_hash: string | null
          role: Database["public"]["Enums"]["role_type"]
          status: string
          invited_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          username: string
          password_hash?: string | null
          role: Database["public"]["Enums"]["role_type"]
          status?: string
          invited_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          username?: string
          password_hash?: string | null
          role?: Database["public"]["Enums"]["role_type"]
          status?: string
          invited_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          code: string
          id: string
          name: string
        }
        Insert: {
          code: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      delivery_status: "IDLE" | "IN_PROGRESS" | "DONE" | "FAILED"
      forecast_type: "INBOUND" | "OUTBOUND"
      location_type:
        | "PICKING"
        | "STORAGE"
        | "EXPEDITION"
        | "RECEPTION"
        | "OTHER"
      operation_type: "RECEIPT" | "TRANSFER" | "PICKING" | "DELIVERY"
      order_status:
        | "DRAFT"
        | "GENERATED"
        | "VALIDATED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
      order_type: "COMMAND" | "PREPARATION" | "PICKING" | "DELIVERY"
      override_status: "APPROVED_AS_IS" | "OVERRIDDEN"
      recommendation_type: "FORECAST" | "STORAGE_ASSIGNMENT" | "PICK_ROUTE"
      role_type: "ADMIN" | "SUPERVISOR" | "EMPLOYEE"
      sync_status: "PENDING" | "SENT" | "APPLIED" | "ERROR"
      task_status:
        | "PENDING"
        | "ASSIGNED"
        | "IN_PROGRESS"
        | "DONE"
        | "BLOCKED"
        | "CANCELLED"
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
      delivery_status: ["IDLE", "IN_PROGRESS", "DONE", "FAILED"],
      forecast_type: ["INBOUND", "OUTBOUND"],
      location_type: ["PICKING", "STORAGE", "EXPEDITION", "RECEPTION", "OTHER"],
      operation_type: ["RECEIPT", "TRANSFER", "PICKING", "DELIVERY"],
      order_status: [
        "DRAFT",
        "GENERATED",
        "VALIDATED",
        "IN_PROGRESS",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      order_type: ["COMMAND", "PREPARATION", "PICKING", "DELIVERY"],
      override_status: ["APPROVED_AS_IS", "OVERRIDDEN"],
      recommendation_type: ["FORECAST", "STORAGE_ASSIGNMENT", "PICK_ROUTE"],
      role_type: ["ADMIN", "SUPERVISOR", "EMPLOYEE"],
      sync_status: ["PENDING", "SENT", "APPLIED", "ERROR"],
      task_status: [
        "PENDING",
        "ASSIGNED",
        "IN_PROGRESS",
        "DONE",
        "BLOCKED",
        "CANCELLED",
      ],
    },
  },
} as const
