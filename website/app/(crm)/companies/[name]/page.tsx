import { notFound } from "next/navigation";
import { getWorkspace } from "@/lib/workspace";
import { companyKey, getCompanies } from "@/lib/companies";
import { CompaniesPage } from "@/components/companies-page";

export const metadata = { title: "Company details" };

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
  const [workspace, { name }] = await Promise.all([getWorkspace(), params]);
  if (!workspace) return null;
  const key = companyKey(name);
  if (!getCompanies(workspace).some((company) => company.key === key)) notFound();
  return <CompaniesPage workspace={workspace} companyName={key} />;
}
