import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import type { EntityRow } from "@/lib/seedstage/entities";

const columns: ColumnDef<EntityRow>[] = [
  { accessorKey: "schema", header: "Schema" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "relation", header: "Relation" },
];

export function EntityTable({ rows }: { rows: EntityRow[] }) {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-border text-xs text-muted">
              {group.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 font-medium">{flexRender(header.column.columnDef.header, header.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
