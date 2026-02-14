import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/types/database";

export type User = Tables<"users">;
export type RoleType = Enums<"role_type">;

// READ - List all users (with optional filters) - Client Side
export async function getUsers(filters?: {
  role?: RoleType;
  search?: string;
  status?: string;
}) {
  const supabase = createClient();

  let query = supabase.from("users").select("*");

  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
  
  return data;
}

// CREATE - Create a new user - Client Side
export async function createUser(user: {
  name: string;
  email?: string;
  role: RoleType;
}) {
  const supabase = createClient();

  console.log('=== Creating User Debug Info ===');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // Create insert data - password_hash can be null according to schema
  const insertData: any = {
    name: user.name,
    role: user.role,
    status: 'invited', // User starts as invited until they set password
  };

  // Only add email if provided
  if (user.email) {
    insertData.email = user.email;
  }

  console.log('User data to insert:', insertData);
  console.log('Exact insert payload:', JSON.stringify(insertData, null, 2));

  try {
    const { data, error } = await supabase
      .from("users")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('=== Supabase Insert Error ===');
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Try to provide a more specific error message
      if (error.code === '23505') {
        if (error.message.includes('email')) {
          throw new Error(`Email "${user.email}" already exists. Please use a different email.`);
        }
        throw new Error('This user already exists. Please check the email.');
      } else if (error.code === '23502') {
        throw new Error(`Missing required field: ${error.message}`);
      } else if (error.code === '42501') {
        throw new Error('Permission denied. Please check if RLS policies are properly configured.');
      } else if (error.message.includes('JWT')) {
        throw new Error('Authentication error. Please check your Supabase credentials.');
      }
      
      throw new Error(error.message || 'Failed to create user');
    }

    console.log('=== User Created Successfully ===');
    console.log('Created user data:', data);
    return data;
  } catch (err) {
    console.error('=== Caught Exception ===');
    console.error('Exception:', err);
    throw err;
  }
}

// UPDATE - Update user details - Client Side
export async function updateUser(id: string, updates: Partial<User>) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(error.message || 'Failed to update user');
  }
  
  return data;
}

// DELETE - Delete a user - Client Side
export async function deleteUser(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
}
