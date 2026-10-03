"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Contact } from "@/lib/workspace";

export function ContactAvatar({
  contact,
  className,
}: {
  contact: Pick<Contact, "id" | "name">;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage
        src={`https://i.pravatar.cc/160?u=${encodeURIComponent(contact.id)}`}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <AvatarFallback>
        {contact.name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}
