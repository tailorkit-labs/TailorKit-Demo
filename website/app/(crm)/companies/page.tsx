import { getWorkspace } from "@/lib/workspace";
import { CompaniesPage } from "@/components/companies-page";

export const metadata = { title: "Companies" };

export default async function Page() {
  const workspace = await getWorkspace();
  return workspace ? <CompaniesPage workspace={workspace} /> : null;
}
