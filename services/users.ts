import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/database";

export type User = Tables<"users">;
export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;
export type RoleType = Enums<"role_type">;

// READ - List all users (with optional filters)
export async function getUsers(filters?: {
  role?: RoleType;
  search?: string;
  status?: string;
}) {
  const supabase = await createClient();

  let query = supabase.from("users").select("*");

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,username.ilike.%${filters.search}%`
    );
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) throw error;
  return data;
}

// READ - Get single user by ID
export async function getUserById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// READ - Get users by role
export async function getUsersByRole(role: RoleType) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", role)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

// CREATE - Create a new user with a role
export async function createUser(user: {
  username: string;
  name: string;
  password_hash: string;
  role: RoleType;
  status?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      username: user.username,
      name: user.name,
      password_hash: user.password_hash,
      role: user.role,
      status: user.status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// UPDATE - Update user details
export async function updateUser(id: string, updates: UserUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// UPDATE - Change user role specifically
export async function updateUserRole(id: string, role: RoleType) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// UPDATE - Change user status
export async function updateUserStatus(id: string, status: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// DELETE - Delete a user
export async function deleteUser(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) throw error;
}