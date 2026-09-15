import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { Role } from "@/types";

export interface AuthContext {
  userId: string;
  role: Role;
  workspaceId: string;
  email: string;
  name: string;
}

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json(
      { error: "Unauthorized: Active session required" },
      { status: 401 }
    );
  }

  return {
    userId: session.user.id,
    role: session.user.role as Role,
    workspaceId: session.user.workspaceId,
    email: session.user.email || "",
    name: session.user.name || "User",
  };
}

export async function requireRole(
  allowedRoles: Role[]
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  if (!allowedRoles.includes(auth.role)) {
    return NextResponse.json(
      {
        error: `Forbidden: Action requires one of [${allowedRoles.join(
          ", "
        )}] roles. Current role: ${auth.role}`,
      },
      { status: 403 }
    );
  }

  return auth;
}

export function isAuthError(result: any): result is NextResponse {
  return result instanceof NextResponse;
}