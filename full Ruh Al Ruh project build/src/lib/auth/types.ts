export const APP_ROLES = ["individual", "family_member", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  preferredLanguage: string;
  culturalContext: string | null;
  familyId: string | null;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  preferredLanguage: string;
  culturalContext: string | null;
  createdAt: string;
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferredLanguage: user.preferredLanguage,
    culturalContext: user.culturalContext,
    createdAt: user.createdAt.toISOString(),
  };
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role: AppRole;
  preferredLanguage: string;
  culturalContext: string | null;
}

export interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateRefreshTokenInput {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

export interface PasswordResetRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface CreatePasswordResetInput {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}
