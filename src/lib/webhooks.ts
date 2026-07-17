import "server-only";

const BRAND_COLOR = 0x7c5cff;

/** Post a compact embed to a Discord webhook URL. Fails soft. */
export async function sendDiscord(
  url: string,
  opts: { title: string; description?: string; fields?: { name: string; value: string }[] }
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Velora",
        embeds: [
          {
            title: opts.title,
            description: opts.description,
            color: BRAND_COLOR,
            fields: opts.fields,
            footer: { text: "Velora" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
