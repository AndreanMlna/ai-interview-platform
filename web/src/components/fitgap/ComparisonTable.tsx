import { useState } from "react";
import { LEVEL_LABELS, LEVEL_DESCRIPTIONS, FIT_GAP_RESULT_LABELS, FIT_GAP_RESULT_CLASSES, parseLevel } from "@/utils/constants";
import { cn } from "@/lib/utils";
import type { SkillComparison, SkillComparisonResult } from "@/types";

interface ComparisonTableProps {
  comparisons: SkillComparison[];
}

type FilterType = "all" | SkillComparisonResult;

function formatLevel(level: number | string | null | undefined): string {
  if (level == null) return "—";
  const num = typeof level === "number" ? level : parseLevel(level);
  const label = LEVEL_LABELS[num] ?? (typeof level === "number" ? `L${level}` : String(level));
  const desc = LEVEL_DESCRIPTIONS[num];
  return desc ? `${label} (${desc})` : label;
}

function ResultBadge({ comparison }: { comparison: SkillComparison }) {
  const label = FIT_GAP_RESULT_LABELS[comparison.result] ?? comparison.result;
  const classes = FIT_GAP_RESULT_CLASSES[comparison.result] ?? "text-neutral-500 bg-neutral-50";

  let icon = "";
  let suffix = "";
  if (comparison.result === "match") icon = "✅";
  else if (comparison.result === "exceed") { icon = "⭐"; suffix = comparison.delta ? ` +${comparison.delta}` : ""; }
  else if (comparison.result === "gap") { icon = "⚠"; suffix = comparison.delta ? ` -${Math.abs(comparison.delta)}` : ""; }
  else icon = "—";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded", classes)}>
      {icon} {label}{suffix}
    </span>
  );
}

export default function ComparisonTable({ comparisons }: ComparisonTableProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No skill comparison records available for this vacancy.
      </div>
    );
  }

  // Summary counts
  const matchCount = comparisons.filter((c) => c.result === "match").length;
  const gapCount = comparisons.filter((c) => c.result === "gap").length;
  const exceedCount = comparisons.filter((c) => c.result === "exceed").length;
  const notAssessedCount = comparisons.filter((c) => c.result === "not_assessed").length;

  const filtered = filter === "all" ? comparisons : comparisons.filter((c) => c.result === filter);

  return (
    <div className="space-y-3">
      {/* Interactive filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium transition-colors border",
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/60 text-muted-foreground hover:bg-muted border-border"
          )}
        >
          All ({comparisons.length})
        </button>
        {matchCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("match")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium transition-colors border",
              filter === "match"
                ? "bg-green-700 text-white border-green-700"
                : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            )}
          >
            ✅ Matches ({matchCount})
          </button>
        )}
        {gapCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("gap")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium transition-colors border",
              filter === "gap"
                ? "bg-amber-700 text-white border-amber-700"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
            )}
          >
            ⚠ Gaps ({gapCount})
          </button>
        )}
        {exceedCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("exceed")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium transition-colors border",
              filter === "exceed"
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200"
            )}
          >
            ⭐ Exceeds ({exceedCount})
          </button>
        )}
        {notAssessedCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("not_assessed")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium transition-colors border",
              filter === "not_assessed"
                ? "bg-neutral-700 text-white border-neutral-700"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-300"
            )}
          >
            ⚪ Unassessed ({notAssessedCount})
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2.5 font-medium">Skill</th>
              <th className="text-center px-4 py-2.5 font-medium">Required</th>
              <th className="text-center px-4 py-2.5 font-medium">Candidate</th>
              <th className="text-center px-4 py-2.5 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-xs italic">
                  No skills match the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => {
                const reqLevel = c.required_level ?? c.expected_level;
                return (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{c.skill_label}</td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">
                      {formatLevel(reqLevel)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {c.candidate_level != null ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-medium">{formatLevel(c.candidate_level)}</span>
                          {c.is_override && (
                            <span
                              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 font-medium cursor-help"
                              title="Adjusted by human assessor override"
                            >
                              ✏ Override
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Not assessed</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <ResultBadge comparison={c} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
        {matchCount > 0 && <span className="font-medium text-green-700">✅ Match: {matchCount}</span>}
        {gapCount > 0 && <span className="font-medium text-amber-700">⚠ Gap: {gapCount}</span>}
        {exceedCount > 0 && <span className="font-medium text-teal-700">⭐ Exceeds: {exceedCount}</span>}
        {notAssessedCount > 0 && <span className="font-medium text-neutral-500">⚪ Unassessed: {notAssessedCount}</span>}
        <span className="ml-auto text-xs italic">✏ = human override applied</span>
      </div>
    </div>
  );
}
