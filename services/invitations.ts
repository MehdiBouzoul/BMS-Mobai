import { createClient } from "@/lib/supabase/server";
import crypto from 'crypto';

export async function createUserInvitation(data: {
  name: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
}) {
  const supabase = await createClient();

  // 1. Create user with invited status
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      name: data.name,
      email: data.email,
      username: data.username,
      role: data.role,
      status: 'invited',
      invited_at: new Date().toISOString(),
      password_hash: null, // No password yet
    })
    .select()
    .single();

  if (userError) throw userError;

  // 2. Generate secure invitation token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // 3. Create invitation record
  const { data: invitation, error: invitationError } = await supabase
    .from('user_invitations')
    .insert({
      user_id: user.id,
      token: token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (invitationError) {
    // Rollback: delete user if invitation creation fails
    await supabase.from('users').delete().eq('id', user.id);
    throw invitationError;
  }

  return {
    user,
    invitation,
    invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${token}`,
  };
}

export async function validateInvitationToken(token: string) {
  const supabase = await createClient();

  const { data: invitation, error } = await supabase
    .from('user_invitations')
    .select('*, users(*)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) throw new Error('Invalid or expired invitation');

  return invitation;
}

export async function acceptInvitation(token: string, password: string) {
  const supabase = await createClient();
  const bcrypt = require('bcryptjs');

  // 1. Validate token
  const invitation = await validateInvitationToken(token);

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Update user with password
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      status: 'active',
    })
    .eq('id', invitation.user_id);

  if (updateError) throw updateError;

  // 4. Mark invitation as accepted
  const { error: acceptError } = await supabase
    .from('user_invitations')
    .update({
      accepted_at: new Date().toISOString(),
    })
    .eq('token', token);

  if (acceptError) throw acceptError;

  return invitation.users;
}
