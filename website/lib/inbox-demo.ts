import { z } from "zod";
import type { Contact } from "@/lib/workspace";

const messageSchema = z.object({
  id: z.string(),
  direction: z.enum(["incoming", "outgoing"]),
  body: z.string().max(5000),
  sentAt: z.string().datetime(),
});
export const inboxSchema = z
  .array(
    z.object({
      id: z.string(),
      contactId: z.string(),
      subject: z.string().min(1).max(160),
      unread: z.boolean(),
      archived: z.boolean(),
      messages: z.array(messageSchema).min(1).max(100),
    }),
  )
  .max(100);
export type InboxThread = z.infer<typeof inboxSchema>[number];

const examples = [
  {
    subject: "A few thoughts on the proposal",
    body: "Thanks for sending the proposal over. The direction looks great, especially the onboarding improvements. Could we walk through the timeline together this week?",
  },
  {
    subject: "Ready to take the next step",
    body: "We’ve reviewed everything with the team and we’re excited to move forward. Let me know what you need from us to get started.",
  },
  {
    subject: "Quick question about the scope",
    body: "Would it be possible to include a short discovery workshop before the first milestone? I think it would help us align the wider team.",
  },
  {
    subject: "Following up on our conversation",
    body: "It was great catching up. I’ve shared your notes with our team. Could you send a little more detail on the options we discussed?",
  },
  {
    subject: "Feedback from the team",
    body: "The team loved the initial concepts. We have a few small comments to share, but overall this feels like the right direction. Thanks for the thoughtful work.",
  },
  {
    subject: "Let’s find a time to connect",
    body: "Do you have availability for a quick call next week? I’d love to talk through our goals and hear how you’d approach the project.",
  },
];
export function seedInbox(contacts: Contact[], now: string): InboxThread[] {
  return contacts.slice(0, 6).map((contact, index) => {
    const example = examples[index];
    const sentAt = new Date(new Date(now).getTime() - index * 3600000 * 5).toISOString();
    return {
      id: "demo-" + contact.id,
      contactId: contact.id,
      subject: example.subject,
      unread: index < 3,
      archived: false,
      messages: [
        {
          id: "intro-" + contact.id,
          direction: "outgoing",
          body: `Hi ${contact.name.split(" ")[0]},\n\nThanks for taking the time to chat about ${contact.company}. I’ve put together some next steps for your team. Let me know what you think.\n\nLooking forward to working together.`,
          sentAt: new Date(new Date(sentAt).getTime() - 86400000).toISOString(),
        },
        {
          id: "response-" + contact.id,
          direction: "incoming",
          body: example.body + `\n\nBest,\n${contact.name.split(" ")[0]}`,
          sentAt,
        },
      ],
    };
  });
}
