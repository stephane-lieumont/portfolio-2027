import type { WorkKind } from '@portfolio/shared-types/project';
import { eq, sql } from 'drizzle-orm';

import type { Db } from '../open-database.ts';
import { stack, tools, works } from '../schema.ts';

export interface ToolUsage {
  readonly works: readonly {
    readonly id: string;
    readonly kind: WorkKind;
    readonly slug: string;
  }[];
  readonly stack: readonly { readonly id: string; readonly domain: WorkKind }[];
}

export type DeleteToolResult =
  | { readonly outcome: 'deleted' }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'in-use'; readonly usedBy: ToolUsage };

/**
 * Where a tool is used, drafts included: the works crediting it, inside their
 * JSON document (ADR-0022), and the Stack entries showing it. What the back
 * office names when it refuses a deletion.
 */
export function toolUsage(db: Pick<Db, 'select'>, toolId: string): ToolUsage {
  const credited = (field: string) =>
    sql`exists (select 1 from json_each(${works.document}, ${field}) where value = ${toolId})`;
  return {
    works: db
      .select({ id: works.id, kind: works.kind, slug: works.slugFr })
      .from(works)
      .where(sql`${credited('$.technologies')} or ${credited('$.software')}`)
      .orderBy(sql`rowid`)
      .all(),
    stack: db
      .select({ id: stack.id, domain: stack.domain })
      .from(stack)
      .where(eq(stack.tool, toolId))
      .all(),
  };
}

/**
 * Deletes a tool nothing uses. SQLite's foreign key already refuses one a
 * Stack entry shows; works hold their tools inside JSON, which no constraint
 * sees, so this is the check that keeps a project from crediting a ghost.
 */
export function deleteTool(db: Db, toolId: string): DeleteToolResult {
  return db.transaction((tx) => {
    const usedBy = toolUsage(tx, toolId);
    if (usedBy.works.length > 0 || usedBy.stack.length > 0) return { outcome: 'in-use', usedBy };
    const { changes } = tx.delete(tools).where(eq(tools.id, toolId)).run();
    return changes === 0 ? { outcome: 'not-found' } : { outcome: 'deleted' };
  });
}
