import { getCurrentUser } from "@/lib/auth";
import { HomeDashboard } from "@/components/HomeDashboard";
import { LoginScreen } from "@/components/LoginScreen";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (user) {
    return <HomeDashboard user={user} />;
  }

  return <LoginScreen />;
}
