import { useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Card } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";

export function AdminResourcePage({ title, description, rows = [], columns = [], actions = [], upload = false }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(normalized));
  }, [query, rows]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {upload ? <Button variant="secondary" icon={UploadCloud}>Upload</Button> : null}
          <Button icon={Plus}>Add New</Button>
        </div>
      </div>
      <Card hover={false}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="form-input w-full pl-11"
              placeholder={`Search ${title.toLowerCase()}`}
            />
          </label>
          <div className="text-sm text-white/45">{filtered.length} records</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-y border-white/10">
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-3 font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42">
                    {column.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-nav text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id || row.name || row.code} className="border-b border-white/7">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-4 text-sm text-white/68">
                      {column.badge ? <Badge tone={row[column.key] === "active" || row[column.key] === "confirmed" ? "green" : "grey"}>{row[column.key]}</Badge> : row[column.key]}
                    </td>
                  ))}
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      {actions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/60 hover:border-captain-gold hover:text-captain-gold"
                        >
                          {action}
                        </button>
                      ))}
                      <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60" aria-label="Edit">
                        <Edit3 size={15} />
                      </button>
                      <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-200" aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
