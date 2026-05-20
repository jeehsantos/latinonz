import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export type AdminRole = "admin" | "manager";

type AuthedSupabaseClient = SupabaseClient<Database>;

type InviteManagerInput = {
  callerUserId: string;
  supabase: AuthedSupabaseClient;
  name?: string;
  email: string;
  role: AdminRole;
  redirectTo?: string;
};

export async function requireAdminRole(
  userId: string,
  authedClient: AuthedSupabaseClient,
): Promise<AdminRole> {
  const { data, error } = await authedClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const role = data?.role;
  if (role !== "admin" && role !== "manager") {
    throw new Error("Forbidden: admin or manager role required");
  }

  return role;
}

async function sendExistingUserMagicLink(email: string, redirectTo?: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      status: "promoted_only" as const,
      warning: "User already existed; role promoted but email service is not configured.",
    };
  }

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      flowType: "implicit",
    },
  });

  const { error } = await anon.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return {
      status: "promoted_only" as const,
      warning: `User already existed; role promoted but magic-link email failed: ${error.message}`,
    };
  }

  return { status: "magic_link_sent" as const, warning: undefined };
}

async function assignManagerRole(userId: string, role: AdminRole) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existingProfile, error: existingError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existingProfile) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (!updateError) {
        return;
      }

      lastError = new Error(updateError.message);
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({ id: userId, role });

      if (!insertError) {
        return;
      }

      if (insertError.code !== "23505") {
        lastError = new Error(insertError.message);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw lastError ?? new Error("Failed to assign manager role");
}

export async function listAdminManagers(input: {
  callerUserId: string;
  supabase: AuthedSupabaseClient;
}) {
  await requireAdminRole(input.callerUserId, input.supabase);

  const { data: rows, error } = await input.supabase.rpc("list_admin_managers");
  if (error) {
    throw new Error(error.message);
  }

  type Row = { id: string; role: string; created_at: string };
  const profiles = (rows ?? []) as unknown as Row[];
  const ids = profiles.map((profile) => profile.id);
  const emailById = new Map<string, string | null>();
  const nameById = new Map<string, string | null>();

  if (ids.length > 0) {
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) {
      throw new Error(usersError.message);
    }

    for (const user of usersData.users) {
      if (!ids.includes(user.id)) continue;

      emailById.set(user.id, user.email ?? null);
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.owner_name === "string" && meta.owner_name) ||
        (typeof meta.name === "string" && meta.name) ||
        null;
      nameById.set(user.id, metaName as string | null);
    }
  }

  return {
    managers: profiles.map((profile) => ({
      id: profile.id,
      role: profile.role as AdminRole,
      name: nameById.get(profile.id) ?? null,
      email: emailById.get(profile.id) ?? null,
      createdAt: profile.created_at,
    })),
  };
}

export async function inviteAdminManager(input: InviteManagerInput) {
  const callerRole = await requireAdminRole(input.callerUserId, input.supabase);
  if (callerRole !== "admin") {
    throw new Error("Forbidden: only admins can invite managers");
  }

  let userId: string | undefined;
  let status: "invited" | "magic_link_sent" | "promoted_only" = "invited";
  let warning: string | undefined;

  const inviteOptions: { data?: Record<string, unknown>; redirectTo?: string } = {};
  if (input.name) {
    inviteOptions.data = { full_name: input.name };
  }
  if (input.redirectTo) {
    inviteOptions.redirectTo = input.redirectTo;
  }

  const { data: invite, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    input.email,
    inviteOptions,
  );

  if (error) {
    const message = error.message?.toLowerCase() ?? "";
    const alreadyExists =
      message.includes("already been registered") ||
      message.includes("already registered") ||
      message.includes("already exists");

    if (!alreadyExists) {
      throw new Error(error.message);
    }

    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      throw new Error(listError.message);
    }

    const existingUser = list.users.find(
      (user) => (user.email ?? "").toLowerCase() === input.email.toLowerCase(),
    );
    if (!existingUser) {
      throw new Error("User already exists but could not be located");
    }

    userId = existingUser.id;
    const magicLinkResult = await sendExistingUserMagicLink(input.email, input.redirectTo);
    status = magicLinkResult.status;
    warning = magicLinkResult.warning;
  } else {
    userId = invite.user?.id;
  }

  if (!userId) {
    throw new Error("Failed to create user");
  }

  await assignManagerRole(userId, input.role);

  const { data: profileAfterUpdate, error: verifyError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (verifyError) {
    throw new Error(verifyError.message);
  }

  if (profileAfterUpdate?.role !== input.role) {
    throw new Error("Failed to persist invited user role");
  }

  return { ok: true as const, userId, status, warning };
}

export async function deleteAdminManager(input: {
  callerUserId: string;
  supabase: AuthedSupabaseClient;
  userId: string;
}) {
  const callerRole = await requireAdminRole(input.callerUserId, input.supabase);
  if (callerRole !== "admin") {
    throw new Error("Forbidden: only admins can remove managers");
  }

  if (input.userId === input.callerUserId) {
    throw new Error("You cannot remove your own account");
  }

  const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(input.userId);
  if (deleteUserError) {
    throw new Error(deleteUserError.message);
  }

  const { error: deleteProfileError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", input.userId);

  if (deleteProfileError) {
    throw new Error(deleteProfileError.message);
  }

  return { ok: true as const };
}