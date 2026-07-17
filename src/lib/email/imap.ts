import "server-only";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { EmailMessage } from "./types";

/**
 * Gmail IMAP connector (app-password based). This is the v1 connector; the
 * pipeline is written against EmailMessage so OAuth / ingest-address / other
 * IMAP providers can be added later without touching the parsers.
 */
export async function fetchMessages(opts: {
  email: string;
  password: string;
  host?: string;
  since: Date;
  limit?: number;
}): Promise<EmailMessage[]> {
  const client = new ImapFlow({
    host: opts.host ?? "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: opts.email, pass: opts.password },
    logger: false,
  });

  const messages: EmailMessage[] = [];
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ since: opts.since });
      if (!uids || uids.length === 0) return [];
      const limited = uids.slice(-(opts.limit ?? 200));

      for await (const msg of client.fetch(limited, { source: true, envelope: true })) {
        if (!msg.source) continue;
        const parsed = await simpleParser(msg.source as Buffer);
        const fromAddr =
          parsed.from?.value?.[0]?.address ??
          parsed.from?.text ??
          msg.envelope?.from?.[0]?.address ??
          "";
        messages.push({
          messageId: parsed.messageId ?? `${opts.email}:${msg.uid}`,
          from: fromAddr,
          subject: parsed.subject ?? "",
          date: parsed.date ?? msg.envelope?.date ?? new Date(),
          text: parsed.text ?? "",
          html: typeof parsed.html === "string" ? parsed.html : "",
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }

  return messages;
}
