import { getWorkspace } from "@/lib/workspace";
import { CrmShell } from "@/components/crm-shell";
import { DemoSetup } from "@/components/demo-setup";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace();
  if (!workspace) return <DemoSetup />;
  return <CrmShell name={workspace.tenant.name}>{children}</CrmShell>;
}
