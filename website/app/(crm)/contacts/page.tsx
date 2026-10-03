import { getWorkspace } from "@/lib/workspace";
import { CrmPages } from "@/components/crm-pages";
export const metadata = { title: "Contacts" };
export default async function Page() {
  const workspace = await getWorkspace();
  return workspace ? <CrmPages workspace={workspace} view="contacts" /> : null;
}
