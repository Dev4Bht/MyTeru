import { AuthenticatedUser } from "@druksave/shared";
import { Profile, User } from "@druksave/database";

export function toAuthenticatedUser(user: User & { profile: Profile | null }): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.profile?.fullName ?? "",
    avatarUrl: user.profile?.avatarUrl ?? null,
    role: user.role,
  };
}
