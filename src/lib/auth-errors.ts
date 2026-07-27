export function formatAuthError(code: string | null): string | null {
  switch (code) {
    case "auth_callback_failed":
      return "Google 로그인에 실패했습니다. 다시 시도해주세요.";
    case "auth_start_failed":
      return "Google 로그인을 시작하지 못했습니다. Supabase Redirect URL 설정을 확인해주세요.";
    case "guest_disabled":
      return "게스트 모드가 비활성화되어 있습니다. Supabase Dashboard → Authentication → Anonymous sign-ins를 켜주세요.";
    case "guest_failed":
      return "게스트 모드 시작에 실패했습니다. 잠시 후 다시 시도해주세요.";
    default:
      return null;
  }
}
