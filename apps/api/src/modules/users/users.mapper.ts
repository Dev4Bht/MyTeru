import { AuthenticatedUser } from "@druksave/shared";
import { Profile, User } from "@druksave/database";

export function toAuthenticatedUser(user: User & { profile: Profile | null }): AuthenticatedUser {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    fullName: user.profile?.fullName ?? "",
    role: user.role,
    isPhoneVerified: user.isPhoneVerified,
  };
}
