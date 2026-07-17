"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { allocateCosts } from "@/lib/costing";
import { detectCarrier, trackingUrl } from "@/lib/carriers";
import type { ParsedOrder } from "@/lib/email/types";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

/** Approve a draft: create a real order (with cost allocation) + any shipments. */
export async function approveDraft(draftId: string) {
  const userId = await requireUserId();
  const draft = await db.parsedOrderDraft.findFirst({
    where: { id: draftId, userId },
    include: { rawEmail: true },
  });
  if (!draft) throw new Error("Draft not found");

  const parsed = draft.extractedJson as unknown as ParsedOrder;
  const retailer = parsed.retailerSlug
    ? await db.retailer.findUnique({ where: { slug: parsed.retailerSlug } })
    : null;

  const items = parsed.items.length
    ? parsed.items
    : [{ name: "Unspecified item", quantity: 1, unitPrice: parsed.grandTotal }];

  const alloc = allocateCosts({
    items: items.map((i) => ({ quantity: i.quantity || 1, unitPrice: i.unitPrice })),
    taxTotal: parsed.taxTotal,
    shippingTotal: parsed.shippingTotal,
    discountTotal: parsed.discountTotal,
  });

  const orderNumber = parsed.orderNumber ?? `EMAIL-${draft.rawEmail.receivedAt.getTime()}`;
  const hasTracking = parsed.trackingNumbers.length > 0;

  const order = await db.order.create({
    data: {
      userId,
      retailerId: retailer?.id ?? null,
      orderNumber,
      status: hasTracking ? "SHIPPED" : "CONFIRMED",
      purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : draft.rawEmail.receivedAt,
      subtotal: alloc.subtotal,
      taxTotal: parsed.taxTotal,
      shippingTotal: parsed.shippingTotal,
      discountTotal: parsed.discountTotal,
      grandTotal: parsed.grandTotal || alloc.grandTotal,
      source: "EMAIL",
      tags: [],
      items: {
        create: items.map((it, idx) => ({
          userId,
          rawName: it.name,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice,
          allocatedTax: alloc.lines[idx].allocatedTax,
          allocatedShipping: alloc.lines[idx].allocatedShipping,
          allocatedDiscount: alloc.lines[idx].allocatedDiscount,
          effectiveUnitCost: alloc.lines[idx].effectiveUnitCost,
        })),
      },
    },
  });

  // Create shipments for any detected tracking numbers.
  for (const tn of parsed.trackingNumbers) {
    const carrier = detectCarrier(tn);
    await db.shipment
      .create({
        data: {
          userId,
          orderId: order.id,
          trackingNumber: tn,
          carrier,
          status: "IN_TRANSIT",
          statusUpdatedAt: new Date(),
          trackingUrl: trackingUrl(tn, carrier),
        },
      })
      .catch(() => {}); // ignore duplicate tracking
  }

  await db.parsedOrderDraft.update({
    where: { id: draftId },
    data: { status: "APPROVED" },
  });

  revalidatePath("/review");
  revalidatePath("/orders");
  return { orderId: order.id };
}

export async function rejectDraft(draftId: string) {
  const userId = await requireUserId();
  await db.parsedOrderDraft.updateMany({
    where: { id: draftId, userId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/review");
}
