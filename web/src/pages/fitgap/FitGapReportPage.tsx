import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ComparisonTable from "@/components/fitgap/ComparisonTable";
import { portfoliosApi } from "@/services/portfolios";
import { sessionsApi } from "@/services/sessions";
import { usePolling } from "@/hooks/usePolling";
import { ArrowLeft, Download, Loader2, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FitGapReport, Portfolio } from "@/types";

export default function FitGapReportPage() {
  const { id, sessionId, vacancyId } = useParams<{
    id: string;
    sessionId: string;
    vacancyId: string;
  }>();

  const [report, setReport] = useState<FitGapReport | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "json" | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!portfolio) return;
    try {
      const res = await portfoliosApi.getFitGap(portfolio.id, Number(vacancyId));
      setReport(res.data.report);
      setGenerating(false);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        try {
          await portfoliosApi.triggerFitGap(portfolio.id, Number(vacancyId));
          setGenerating(true);
        } catch {
          setGenerating(false);
        }
      }
    }
  }, [portfolio, vacancyId]);

  useEffect(() => {
    sessionsApi
      .getPortfolio(Number(sessionId))
      .then(async (res) => {
        const data = res.data as any;
        if (data.portfolio) {
          setPortfolio(data.portfolio);
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (portfolio) fetchReport();
  }, [portfolio, fetchReport]);

  usePolling(fetchReport, 5000, generating && !!portfolio);

  const handleRegenerate = async () => {
    if (!portfolio) return;
    setRegenerating(true);
    try {
      await portfoliosApi.regenerateFitGap(portfolio.id, Number(vacancyId));
      setReport(null);
      setGenerating(true);
    } finally {
      setRegenerating(false);
    }
  };

  const handleExport = async (format: "pdf" | "json") => {
    if (!portfolio) return;
    setExporting(format);
    try {
      const res = await portfoliosApi.exportPortfolio(portfolio.id, format, Number(vacancyId));
      const ext = format;
      const blob = format === "pdf"
        ? new Blob([res.data as BlobPart], { type: "application/pdf" })
        : new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitgap-${sessionId}-${vacancyId}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/assessments/${id}/sessions/${sessionId}/portfolio`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-semibold">Fit/Gap Report</h1>
          </div>
        </div>

        {portfolio && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating || generating}>
              {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
              Regenerate
            </Button>
            {report && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={!!exporting}>
                  {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("json")} disabled={!!exporting}>
                  {exporting === "json" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                  JSON
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Generating */}
      {generating && (
        <div className="border rounded-lg p-12 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Generating fit/gap report...</p>
        </div>
      )}

      {/* Report ready */}
      {report && (
        <>
          {/* Executive KPI Scorecard */}
          {(() => {
            const comps = report.skill_comparisons || [];
            const total = comps.length;
            const matchCount = comps.filter((c) => c.result === "match").length;
            const exceedCount = comps.filter((c) => c.result === "exceed").length;
            const gapCount = comps.filter((c) => c.result === "gap").length;
            const unassessedCount = comps.filter((c) => c.result === "not_assessed").length;
            const fitScore = total > 0 ? Math.round(((matchCount + exceedCount) / total) * 100) : 0;

            let badgeText = "Strong Candidate Fit";
            let badgeBg = "bg-green-100 text-green-800 border-green-200";
            if (unassessedCount > 0) {
              badgeText = "Evaluation Incomplete";
              badgeBg = "bg-neutral-100 text-neutral-800 border-neutral-200";
            } else if (gapCount > 1) {
              badgeText = "Substantial Skill Gaps";
              badgeBg = "bg-amber-100 text-amber-800 border-amber-200";
            } else if (gapCount === 1) {
              badgeText = "Minor Skill Gap Identified";
              badgeBg = "bg-blue-100 text-blue-800 border-blue-200";
            }

            return (
              <Card className="bg-gradient-to-br from-card to-muted/20 border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Executive Summary</span>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", badgeBg)}>
                          {badgeText}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">{fitScore}%</span>
                        <span className="text-sm text-muted-foreground font-medium">Role Competency Fit</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <div className="rounded-lg bg-green-50 border border-green-200/60 px-3 py-1.5 text-center">
                        <div className="font-bold text-green-700 text-sm">{matchCount + exceedCount}</div>
                        <div className="text-[11px] text-green-600 font-medium">Meets/Exceeds</div>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-1.5 text-center">
                        <div className="font-bold text-amber-700 text-sm">{gapCount}</div>
                        <div className="text-[11px] text-amber-600 font-medium">Skill Gaps</div>
                      </div>
                      <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-1.5 text-center">
                        <div className="font-bold text-neutral-700 text-sm">{unassessedCount}</div>
                        <div className="text-[11px] text-neutral-500 font-medium">Unassessed</div>
                      </div>
                    </div>
                  </div>

                  {/* Ratio bar */}
                  {total > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-100">
                        {matchCount + exceedCount > 0 && (
                          <div
                            style={{ width: `${((matchCount + exceedCount) / total) * 100}%` }}
                            className="bg-green-600 transition-all duration-500"
                            title={`Fit: ${matchCount + exceedCount}`}
                          />
                        )}
                        {gapCount > 0 && (
                          <div
                            style={{ width: `${(gapCount / total) * 100}%` }}
                            className="bg-amber-500 transition-all duration-500"
                            title={`Gaps: ${gapCount}`}
                          />
                        )}
                        {unassessedCount > 0 && (
                          <div
                            style={{ width: `${(unassessedCount / total) * 100}%` }}
                            className="bg-neutral-300 transition-all duration-500"
                            title={`Unassessed: ${unassessedCount}`}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Skill comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Skill Comparison</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ComparisonTable comparisons={report.skill_comparisons} />
            </CardContent>
          </Card>

          <Separator />

          {/* Culture & competency */}
          {report.culture_narrative && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Culture &amp; Competency Fit
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {report.culture_narrative}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Overall hiring narrative */}
          {report.overall_narrative && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  Overall Hiring Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {report.overall_narrative}
                </p>
              </CardContent>
            </Card>
          )}

          {!report.culture_narrative && !report.overall_narrative && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground italic text-center">
                No narrative evaluation generated for this fit/gap report.
              </CardContent>
            </Card>
          )}

          {/* Discovered skills */}
          {portfolio && portfolio.skills.some((s) => s.is_discovered) && (
            <>
              <Separator />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Discovered Skills (not in vacancy requirements)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {portfolio.skills
                    .filter((s) => s.is_discovered)
                    .map((s) => (
                      <div key={s.id} className="text-sm flex items-center gap-2">
                        <span className="font-medium">{s.skill_label}</span>
                        <span className="text-muted-foreground">
                          {s.ai_level} ({s.ai_confidence?.toLowerCase() === "low" ? "low confidence" : "confirmed"})
                        </span>
                        <span className="text-xs text-muted-foreground">— Not required for this role, may be additive.</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
