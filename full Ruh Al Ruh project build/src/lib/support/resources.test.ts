import { describe, expect, it } from "vitest";
import { LANGUAGE_CODES } from "@/lib/conversation/types";
import { formatResourceDirectory, getResourceDirectory } from "./resources";

describe("reviewed resource directory", () => {
  it("returns no invented entries for an unreviewed jurisdiction", () => {
    const result = getResourceDirectory({ language: "en", jurisdiction: "United Kingdom" });

    expect(result).toMatchObject({
      jurisdiction: "United Kingdom",
      language: "en",
      resources: [],
      reviewedOnly: true,
    });
    expect(result.notice).toContain("No reviewed support services");
  });

  it("renders the unavailable notice without inventing a contact number", () => {
    const result = getResourceDirectory({ language: "en", jurisdiction: "unknown" });

    expect(formatResourceDirectory(result)).toBe(result.notice);
    expect(result.notice).not.toMatch(/\d/);
  });

  it("has an unavailable notice in every supported language", () => {
    for (const language of LANGUAGE_CODES) {
      const result = getResourceDirectory({ language, jurisdiction: "unspecified" });

      expect(result.notice.length).toBeGreaterThan(0);
      expect(result.resources).toEqual([]);
      expect(result.notice).not.toMatch(/\d/);
    }
  });

  it("returns the approved US sources in English and Spanish", () => {
    const expectedIds = [
      "us-988",
      "us-crisis-text-line",
      "us-veterans-crisis-line",
    ];

    for (const language of ["en", "es"] as const) {
      const result = getResourceDirectory({ language, jurisdiction: "United States" });

      expect(result).toMatchObject({
        jurisdiction: "United States",
        language,
        notice: "",
        reviewedOnly: true,
      });
      expect(result.resources.map((resource) => resource.id)).toEqual(
        expectedIds.map((id) => `${id}-${language}`),
      );

      for (const resource of result.resources) {
        expect(resource.jurisdiction).toBe("United States");
        expect(resource.language).toBe(language);
        expect(resource.source).toContain("https://");
        expect(resource.reviewedAt).toBe("2026-11-25");
        expect(resource.details.length).toBeGreaterThan(0);
      }
    }
  });

  it("does not serve US entries in unreviewed languages", () => {
    for (const language of LANGUAGE_CODES) {
      if (language === "en" || language === "es") continue;

      const result = getResourceDirectory({ language, jurisdiction: "usa" });
      expect(result.resources).toEqual([]);
      expect(result.notice.length).toBeGreaterThan(0);
    }
  });

  it("normalises common US labels to the reviewed jurisdiction", () => {
    for (const jurisdiction of ["usa", "US", "U.S.", "U.S.A.", "United States", "united states of america"]) {
      const result = getResourceDirectory({ language: "en", jurisdiction });
      expect(result.jurisdiction).toBe("United States");
      expect(result.resources).toHaveLength(3);
    }
  });

  it("shows every verified source and review date in the visible directory text", () => {
    const result = getResourceDirectory({ language: "en", jurisdiction: "usa" });
    const formatted = formatResourceDirectory(result);

    expect(formatted).toContain("988lifeline.org");
    expect(formatted).toContain("crisistextline.org/text-us");
    expect(formatted).toContain("veteranscrisisline.net");
    expect(formatted).toContain("741741");
    expect(formatted).toContain("838255");
    expect(formatted.match(/2026-11-25/g)).toHaveLength(3);
    expect(formatted).not.toContain("riskScore");
    expect(formatted).not.toContain("hiddenFlag");
  });
});
