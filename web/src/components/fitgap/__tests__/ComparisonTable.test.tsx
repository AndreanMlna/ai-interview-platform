import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ComparisonTable from "../ComparisonTable";
import type { SkillComparison } from "@/types";

describe("ComparisonTable", () => {
  it("renders empty state message when comparisons array is empty", () => {
    render(<ComparisonTable comparisons={[]} />);
    expect(
      screen.getByText(/no skill comparison records available for this vacancy/i)
    ).toBeInTheDocument();
  });

  it("renders comparison table with required_level and candidate levels formatted nicely", () => {
    const mockComparisons: SkillComparison[] = [
      {
        skill_id: 1,
        skill_label: "Ruby on Rails",
        required_level: 4,
        candidate_level: 5,
        delta: 1,
        result: "exceed",
        is_override: false,
      },
      {
        skill_id: 2,
        skill_label: "PostgreSQL",
        required_level: 3,
        candidate_level: 3,
        delta: 0,
        result: "match",
        is_override: false,
      },
    ];

    render(<ComparisonTable comparisons={mockComparisons} />);

    expect(screen.getByText("Ruby on Rails")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    // Advanced label L4 (Advanced)
    expect(screen.getByText("L4 (Advanced)")).toBeInTheDocument();
    // Expert label L5 (Expert)
    expect(screen.getByText("L5 (Expert)")).toBeInTheDocument();
    // Exceed badge
    expect(screen.getByText(/Exceeds \+1/i)).toBeInTheDocument();
    // Match badge (appears in row and summary)
    expect(screen.getAllByText(/Match/i).length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to expected_level if required_level is undefined (backward compatibility seam)", () => {
    const mockComparisons: SkillComparison[] = [
      {
        skill_id: 3,
        skill_label: "System Architecture",
        expected_level: 5, // Legacy contract key
        candidate_level: 3,
        delta: -2,
        result: "gap",
        is_override: false,
      },
    ];

    render(<ComparisonTable comparisons={mockComparisons} />);

    expect(screen.getByText("System Architecture")).toBeInTheDocument();
    expect(screen.getByText("L5 (Expert)")).toBeInTheDocument();
    expect(screen.getByText("L3 (Proficient)")).toBeInTheDocument();
    expect(screen.getByText(/Gap -2/i)).toBeInTheDocument();
  });

  it("displays human override indicator (✏ Override) when is_override is true", () => {
    const mockComparisons: SkillComparison[] = [
      {
        skill_id: 4,
        skill_label: "Docker & Containerization",
        required_level: 3,
        candidate_level: 4,
        delta: 1,
        result: "exceed",
        is_override: true,
      },
      {
        skill_id: 5,
        skill_label: "Kubernetes",
        required_level: 3,
        candidate_level: 1,
        delta: -2,
        result: "gap",
        is_override: false,
      },
    ];

    render(<ComparisonTable comparisons={mockComparisons} />);

    // Override badge should be present for Docker
    expect(screen.getByText(/✏ Override/i)).toBeInTheDocument();
    // And only one override badge should exist
    expect(screen.getAllByText(/✏ Override/i)).toHaveLength(1);
  });

  it("handles unassessed skills gracefully with 'Not assessed' label and summary count", () => {
    const mockComparisons: SkillComparison[] = [
      {
        skill_id: 6,
        skill_label: "GraphQL API",
        required_level: 3,
        candidate_level: null as any,
        delta: null as any,
        result: "not_assessed",
        is_override: false,
      },
    ];

    render(<ComparisonTable comparisons={mockComparisons} />);

    expect(screen.getByText("GraphQL API")).toBeInTheDocument();
    // Both candidate cell and result badge display "Not assessed"
    const notAssessedElements = screen.getAllByText(/Not assessed/i);
    expect(notAssessedElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/⚪ Unassessed: 1/i)).toBeInTheDocument();
  });

  it("computes accurate summary counts in the table footer", () => {
    const mockComparisons: SkillComparison[] = [
      { skill_id: 1, skill_label: "Skill 1", required_level: 1, candidate_level: 1, delta: 0, result: "match" },
      { skill_id: 2, skill_label: "Skill 2", required_level: 3, candidate_level: 4, delta: 1, result: "exceed" },
      { skill_id: 3, skill_label: "Skill 3", required_level: 4, candidate_level: 2, delta: -2, result: "gap" },
      { skill_id: 4, skill_label: "Skill 4", required_level: 4, candidate_level: null as any, delta: null as any, result: "not_assessed" },
    ];

    render(<ComparisonTable comparisons={mockComparisons} />);

    expect(screen.getByText(/✅ Match: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/⚠ Gap: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/⭐ Exceeds: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/⚪ Unassessed: 1/i)).toBeInTheDocument();
  });

  it("filters skill rows dynamically when filter pills are clicked", () => {
    const mockComparisons: SkillComparison[] = [
      { skill_id: 1, skill_label: "Skill Alpha Match", required_level: 2, candidate_level: 2, delta: 0, result: "match" },
      { skill_id: 2, skill_label: "Skill Beta Gap", required_level: 4, candidate_level: 2, delta: -2, result: "gap" },
    ];

    const { getByRole, getByText, queryByText } = render(<ComparisonTable comparisons={mockComparisons} />);

    // Initially both skills are rendered
    expect(getByText("Skill Alpha Match")).toBeInTheDocument();
    expect(getByText("Skill Beta Gap")).toBeInTheDocument();

    // Click Gaps filter pill
    fireEvent.click(getByRole("button", { name: /Gaps/i }));
    expect(queryByText("Skill Alpha Match")).not.toBeInTheDocument();
    expect(getByText("Skill Beta Gap")).toBeInTheDocument();

    // Click All filter pill
    fireEvent.click(getByRole("button", { name: /^All/i }));
    expect(getByText("Skill Alpha Match")).toBeInTheDocument();
    expect(getByText("Skill Beta Gap")).toBeInTheDocument();
  });
});
