import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
export default function NotFound() {
  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyTitle>This page has moved on</EmptyTitle>
        <EmptyDescription>
          The contact or page you’re looking for could not be found.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/contacts" />}>Back to contacts</Button>
      </EmptyContent>
    </Empty>
  );
}
