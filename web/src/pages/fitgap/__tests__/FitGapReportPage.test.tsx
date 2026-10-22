import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import FitGapReportPage from "../FitGapReportPage";
import { portfoliosApi } from "@/services/portfolios";
import { sessionsApi } from "@/services/sessions";

// Mock API services
vi.mock("@/services/portfolios", () => ({
  portfoliosApi: {
    getFitGap: vi.fn(),
    triggerFitGap: vi.fn(),
    regenerateFitGap: vi.fn(),
    exportPortfolio: vi.fn(),
  },
}));

vi.mock("@/services/sessions", () => ({
  sessionsApi: {
    getPortfolio: vi.fn(),
  },
}));

describe("FitGapReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders both Culture & Competency Fit and Overall Hiring Recommendation narratives without suppression", async () => {
    (sessionsApi.getPortfolio as any).mockResolvedValue({
      data: {
        portfolio: {
          id: 101,
          session_id: 1,
          skills: [],
        },
      },
    });

    (portfoliosApi.getFitGap as any).mockResolvedValue({
      data: {
        report: {
          id: 501,
          portfolio_id: 101,
          vacancy_id: 202,
          skill_comparisons: [
            {
              skill_id: 1,
              skill_label: "Ruby on Rails",
              required_level: 4,
              candidate_level: 4,
              result: "match",
              delta: 0,
            },
          ],
          culture_narrative: "Candidate exhibits strong engineering leadership and collaborative problem-solving.",
          overall_narrative: "Strong Hire: Exceeds backend architecture criteria with zero red flags.",
          generated_at: "2026-10-22T10:00:00Z",
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/assessments/1/sessions/1/fitgap/202"]}>
        <Routes>
          <Route path="/assessments/:id/sessions/:sessionId/fitgap/:vacancyId" element={<FitGapReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Culture & Competency Fit")).toBeInTheDocument();
    });

    // Verify Culture narrative is rendered
    expect(
      screen.getByText(/candidate exhibits strong engineering leadership/i)
    ).toBeInTheDocument();

    // Verify Overall Hiring Recommendation is ALSO rendered (no suppression)
    expect(screen.getByText("Overall Hiring Recommendation")).toBeInTheDocument();
    expect(
      screen.getByText(/strong hire: exceeds backend architecture criteria/i)
    ).toBeInTheDocument();
  });

  it("displays empty narrative card when neither culture nor overall narrative exists", async () => {
    (sessionsApi.getPortfolio as any).mockResolvedValue({
      data: {
        portfolio: {
          id: 102,
          session_id: 1,
          skills: [],
        },
      },
    });

    (portfoliosApi.getFitGap as any).mockResolvedValue({
      data: {
        report: {
          id: 502,
          portfolio_id: 102,
          vacancy_id: 202,
          skill_comparisons: [],
          culture_narrative: null,
          overall_narrative: null,
          generated_at: "2026-10-22T10:00:00Z",
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/assessments/1/sessions/1/fitgap/202"]}>
        <Routes>
          <Route path="/assessments/:id/sessions/:sessionId/fitgap/:vacancyId" element={<FitGapReportPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no narrative evaluation generated for this fit\/gap report/i)
      ).toBeInTheDocument();
    });
  });
});
