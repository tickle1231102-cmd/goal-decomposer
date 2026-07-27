import type { User } from "@supabase/supabase-js";

export type UserDisplayInfo = {
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  displayName: string;
};

export function getUserDisplayInfo(user: User): UserDisplayInfo {
  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : null;

  const avatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata.picture === "string"
        ? user.user_metadata.picture
        : null;

  const isGuest = user.is_anonymous === true;
  const displayName =
    fullName ?? user.email ?? (isGuest ? "게스트" : "사용자");

  return {
    email: user.email ?? null,
    fullName,
    avatarUrl,
    isGuest,
    displayName,
  };
}
