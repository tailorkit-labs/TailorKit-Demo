import { notFound } from "next/navigation";
import { getWorkspace } from "@/lib/workspace";
import { CrmPages } from "@/components/crm-pages";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [workspace, { id }] = await Promise.all([getWorkspace(), params]);
  if (!workspace) return null;
  if (!workspace.contacts.some((c) => c.id === id)) notFound();
  return <CrmPages workspace={workspace} view="contacts" contactId={id} />;
}
