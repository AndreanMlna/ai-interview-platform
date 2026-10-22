import { LEVEL_LABELS, LEVEL_DESCRIPTIONS, FIT_GAP_RESULT_LABELS, FIT_GAP_RESULT_CLASSES, parseLevel } from "@/utils/constants";
import { cn } from "@/lib/utils";
import type { SkillComparison } from "@/types";

interface ComparisonTableProps {
  comparisons: SkillComparison[];
}

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

  return (
    <div className="space-y-3">
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
            {comparisons.map((c, i) => {
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
            })}
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
