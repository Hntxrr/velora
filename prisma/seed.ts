import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// v1 retailers with dedicated email parsers, plus common ones for the generic
// fallback. parserKey maps to a parser implementation (added in the email feature).
const RETAILERS: {
  name: string;
  slug: string;
  parserKey: string | null;
  websiteUrl: string;
}[] = [
  { name: "Pokémon Center", slug: "pokemon-center", parserKey: "pokemon_center", websiteUrl: "https://www.pokemoncenter.com" },
  { name: "Walmart", slug: "walmart", parserKey: "walmart", websiteUrl: "https://www.walmart.com" },
  { name: "Target", slug: "target", parserKey: "target", websiteUrl: "https://www.target.com" },
  { name: "Amazon", slug: "amazon", parserKey: "amazon", websiteUrl: "https://www.amazon.com" },
  { name: "Costco", slug: "costco", parserKey: "costco", websiteUrl: "https://www.costco.com" },
  { name: "Sam's Club", slug: "sams-club", parserKey: "sams_club", websiteUrl: "https://www.samsclub.com" },
  { name: "Best Buy", slug: "best-buy", parserKey: "best_buy", websiteUrl: "https://www.bestbuy.com" },
  // Common additional retailers handled by the generic fallback parser.
  { name: "GameStop", slug: "gamestop", parserKey: null, websiteUrl: "https://www.gamestop.com" },
  { name: "LEGO", slug: "lego", parserKey: null, websiteUrl: "https://www.lego.com" },
  { name: "Nintendo", slug: "nintendo", parserKey: null, websiteUrl: "https://www.nintendo.com" },
  { name: "eBay", slug: "ebay", parserKey: null, websiteUrl: "https://www.ebay.com" },
];

async function main() {
  console.log("Seeding retailers…");
  for (const r of RETAILERS) {
    await db.retailer.upsert({
      where: { slug: r.slug },
      update: { name: r.name, parserKey: r.parserKey, websiteUrl: r.websiteUrl },
      create: r,
    });
  }
  console.log(`Seeded ${RETAILERS.length} retailers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
