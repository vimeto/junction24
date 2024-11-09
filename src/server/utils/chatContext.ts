import { db } from "../db";
import { audits, locations, itemAudits, items } from "../db/schema";
import { eq, and, isNull, notInArray } from "drizzle-orm";

type ContextItem = {
  id: number;
  requireImage: boolean;
  identifier: string | null;
  identifierType: string | null;
  itemType: string | null;
  collectionAmount: number | null;
  metadata: string | null;
};

export async function buildChatContext(auditUuid: string): Promise<string> {
  // Get the audit and related data
  const audit = await db.query.audits.findFirst({
    where: eq(audits.uuid, auditUuid),
    with: {
      organization: true,
      location: true,
      auditer: true,
      itemAudits: {
        with: {
          item: true,
        },
      },
    },
  });

  if (!audit) {
    throw new Error("Audit not found");
  }

  const auditerId = audit.auditer?.id;
  const auditerName = audit.auditer?.name;

  const allItemIds = audit.itemAudits.map(itemAudit => itemAudit.item?.id).filter(id => id !== null) as number[];

  // Group items by audit date
  const itemsByDate = audit.itemAudits.reduce((acc: Record<string, ContextItem[]>, itemAudit) => {
    // Ensure we have a valid date, default to today if undefined
    const date = itemAudit.createdAt?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0] as string;

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      id: itemAudit.item?.id ?? 0,
      requireImage: itemAudit.item?.requireImage ?? false,
      identifier: itemAudit.item?.identifier ?? null,
      identifierType: itemAudit.item?.identifierType ?? null,
      itemType: itemAudit.item?.itemType ?? null,
      collectionAmount: itemAudit.item?.collectionAmount ?? null,
      metadata: itemAudit.item?.metadata ?? null,
    });
    return acc;
  }, {} as Record<string, ContextItem[]>);

  const notAuditedItems = await db.query.items.findMany({
    where: notInArray(items.id, allItemIds),
  });

  // Build context string
  let context = `<context>
# general
- today's date: ${new Date().toISOString().split('T')[0]}
- auditer: ${auditerName ?? "Unknown Auditor"}
- auditer id: ${auditerId ?? "Unknown Auditor ID"}

# organization
- name: ${audit.organization?.name ?? "Unknown Organization"}

# location
- name: ${audit.location?.name ?? "Unknown Location"}
- coordinates: ${audit.location?.latitude ?? "N/A"}, ${audit.location?.longitude ?? "N/A"}`;

  // Add items grouped by audit date
  Object.entries(itemsByDate).forEach(([date, items]) => {
    context += `\n# items audited to this location on ${date}
${items.map(item => `{
  id: ${item.id},
  require_image: ${item.requireImage},
  identifier: ${item.identifier ?? "null"},
  identifier_type: ${item.identifierType ?? "null"},
  item_type: ${item.itemType ?? "null"},
  collection_amount: ${item.collectionAmount ?? 1},
  metadata: ${item.metadata ?? "null"}
}`).join(',\n')}`;
  });

  if (notAuditedItems.length > 0) {
    context += `\n# items never audited to this location
${notAuditedItems.map(item => `{
  id: ${item.id},
  require_image: ${item.requireImage},
  identifier: ${item.identifier ?? "null"},
  identifier_type: ${item.identifierType ?? "null"},
  item_type: ${item.itemType ?? "null"},
  collection_amount: ${item.collectionAmount ?? 1},
  metadata: ${item.metadata ?? "null"}
}`).join(',\n')}`;
  }

  context += '\n</context>';
  return context;
}
