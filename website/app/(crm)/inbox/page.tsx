import { getWorkspace } from "@/lib/workspace";
import { InboxPage } from "@/components/inbox-page";
export const metadata = { title: "Inbox" };
export default async function Page() {
  const workspace = await getWorkspace();
  return workspace ? (
    <InboxPage key={workspace.tenant.id} workspace={workspace} now={new Date().toISOString()} />
  ) : null;
}
