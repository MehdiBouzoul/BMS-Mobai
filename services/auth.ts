import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import type { Tables, Enums } from "@/types/database";

export type User = Tables<"users">;
export type AuthToken = Tables<"auth_tokens">;
export type RoleType = Enums<"role_type">;

// Authenticated user payload (safe to expose, no password_hash)
export type AuthUser = Omit<User, "password_hash">;

// Token expiry duration (24 hours)
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Refresh token expiry (7 days)
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────
// LOGIN - Authenticate user with username/password
// POST /auth/login
// ─────────────────────────────────────────────
export async function login(username: string, passwordHash: string) {
  const supabase = await createClient();

  // 1. Find user by username
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (userError || !user) {
    throw new Error("Invalid username or password");
  }

  // 2. Verify password hash
  if (user.password_hash !== passwordHash) {
    throw new Error("Invalid username or password");
  }

  // 3. Check user is active
  if (user.status !== "active") {
    throw new Error("Account is inactive. Contact an administrator.");
  }

  // 4. Generate token and store in auth_tokens
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

  const { error: tokenError } = await supabase
    .from("auth_tokens")
    .insert({
      token,
      user_id: user.id,
      expires_at: expiresAt,
    });

  if (tokenError) throw tokenError;

  // 5. Return user (without password_hash) + token
  const { password_hash: _, ...safeUser } = user;

  return {
    user: safeUser as AuthUser,
    token,
    expires_at: expiresAt,
  };
}

// ─────────────────────────────────────────────
// REFRESH TOKEN - Issue a new token, invalidate the old one
// POST /auth/refresh
// ─────────────────────────────────────────────
export async function refreshToken(currentToken: string) {
  const supabase = await createClient();

  // 1. Validate current token
  const { data: tokenRecord, error: tokenError } = await supabase
    .from("auth_tokens")
    .select("*, users(*)")
    .eq("token", currentToken)
    .single();

  if (tokenError || !tokenRecord) {
    throw new Error("Invalid or expired token");
  }

  // 2. Check token is not expired
  if (new Date(tokenRecord.expires_at) < new Date()) {
    // Clean up expired token
    await supabase.from("auth_tokens").delete().eq("token", currentToken);
    throw new Error("Token has expired. Please login again.");
  }

  // 3. Delete old token
  await supabase.from("auth_tokens").delete().eq("token", currentToken);

  // 4. Issue new token with extended expiry
  const newToken = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString();

  const { error: insertError } = await supabase
    .from("auth_tokens")
    .insert({
      token: newToken,
      user_id: tokenRecord.user_id,
      expires_at: expiresAt,
    });

  if (insertError) throw insertError;

  return {
    token: newToken,
    expires_at: expiresAt,
  };
}

// ─────────────────────────────────────────────
// LOGOUT - Invalidate a token
// POST /auth/logout
// ─────────────────────────────────────────────
export async function logout(token: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("auth_tokens")
    .delete()
    .eq("token", token);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// LOGOUT ALL - Invalidate all tokens for a user (force logout everywhere)
// POST /auth/logout-all
// ─────────────────────────────────────────────
export async function logoutAll(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("auth_tokens")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// VERIFY TOKEN - Check if a token is valid and return the user
// Used by middleware/gateway for route protection
// GET /auth/me
// ─────────────────────────────────────────────
export async function verifyToken(token: string): Promise<AuthUser | null> {
  const supabase = await createClient();

  // 1. Look up token
  const { data: tokenRecord, error: tokenError } = await supabase
    .from("auth_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (tokenError || !tokenRecord) {
    return null;
  }

  // 2. Check expiry
  if (new Date(tokenRecord.expires_at) < new Date()) {
    // Clean up expired token
    await supabase.from("auth_tokens").delete().eq("token", token);
    return null;
  }

  // 3. Fetch the user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", tokenRecord.user_id)
    .single();

  if (userError || !user) {
    return null;
  }

  // 4. Return safe user (no password_hash)
  const { password_hash: _, ...safeUser } = user;
  return safeUser as AuthUser;
}

// ─────────────────────────────────────────────
// GET CURRENT USER - Alias for verifyToken
// GET /auth/me
// ─────────────────────────────────────────────
export async function getCurrentUser(token: string): Promise<AuthUser | null> {
  return verifyToken(token);
}

// ─────────────────────────────────────────────
// RESET PASSWORD - Admin-triggered password reset
// POST /auth/reset-password
// ─────────────────────────────────────────────
export async function resetPassword(
  userId: string,
  newPasswordHash: string,
  adminToken: string
) {
  // 1. Verify the admin performing the reset
  const admin = await verifyToken(adminToken);

  if (!admin) {
    throw new Error("Unauthorized: Invalid admin token");
  }

  if (admin.role !== "ADMIN") {
    throw new Error("Forbidden: Only admins can reset passwords");
  }

  const supabase = await createClient();

  // 2. Update the user's password
  const { data, error } = await supabase
    .from("users")
    .update({ password_hash: newPasswordHash })
    .eq("id", userId)
    .select("id, username, name, role, status")
    .single();

  if (error) throw error;

  // 3. Invalidate all existing tokens for the user (force re-login)
  await logoutAll(userId);

  return data;
}

// ─────────────────────────────────────────────
// CHANGE OWN PASSWORD - User changes their own password
// POST /auth/change-password
// ─────────────────────────────────────────────
export async function changePassword(
  token: string,
  currentPasswordHash: string,
  newPasswordHash: string
) {
  // 1. Verify the requesting user
  const user = await verifyToken(token);

  if (!user) {
    throw new Error("Unauthorized: Invalid token");
  }

  const supabase = await createClient();

  // 2. Verify current password
  const { data: fullUser, error: fetchError } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", user.id)
    .single();

  if (fetchError || !fullUser) {
    throw new Error("User not found");
  }

  if (fullUser.password_hash !== currentPasswordHash) {
    throw new Error("Current password is incorrect");
  }

  // 3. Update password
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newPasswordHash })
    .eq("id", user.id);

  if (updateError) throw updateError;

  // 4. Invalidate all other tokens, keep current session
  const { error: deleteError } = await supabase
    .from("auth_tokens")
    .delete()
    .eq("user_id", user.id)
    .neq("token", token);

  if (deleteError) throw deleteError;
}

// ─────────────────────────────────────────────
// CLEANUP EXPIRED TOKENS - Housekeeping
// Called periodically (cron or admin action)
// ─────────────────────────────────────────────
export async function cleanupExpiredTokens() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("auth_tokens")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) throw error;
}
