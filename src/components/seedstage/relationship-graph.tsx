import { Background, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { EntityRow } from "@/lib/seedstage/entities";

export function RelationshipGraph({ rows }: { rows: EntityRow[] }) {
  const company = rows.find((row) => row.kind === "Company");
  if (!company) return null;
  const nodes: Node[] = [{ id: company.id, position: { x: 260, y: 90 }, data: { label: company.name }, style: { width: 180 } }];
  const edges: Edge[] = [];
  rows.forEach((row, index) => {
    if (row.id === company.id) return;
    const left = row.kind === "Person";
    nodes.push({
      id: row.id,
      position: { x: left ? 20 : 500, y: 40 + index * 70 },
      data: { label: row.name },
      style: { width: 180 },
    });
    edges.push({
      id: `${row.id}-${company.id}`,
      source: left ? row.id : company.id,
      target: left ? company.id : row.id,
      label: row.relation,
    });
  });

  return (
    <div className="h-72 w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-surface">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}>
        <Background />
      </ReactFlow>
    </div>
  );
}
