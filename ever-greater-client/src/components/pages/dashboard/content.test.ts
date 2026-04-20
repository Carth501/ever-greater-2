import { describe, expect, it } from "vitest";
import { dashboardContent } from "./content";

function expectNonEmpty(value: string) {
  expect(value.trim().length).toBeGreaterThan(0);
}

describe("dashboard content contract", () => {
  it("keeps required labels and copy values populated", () => {
    expectNonEmpty(dashboardContent.mainRegionLabel);

    const sections = [
      dashboardContent.hero,
      dashboardContent.toolbar,
      dashboardContent.account,
      dashboardContent.ticket,
      dashboardContent.print,
      dashboardContent.shop,
      dashboardContent.status,
      dashboardContent.insights,
      dashboardContent.summary,
    ];

    sections.forEach((section) => {
      expectNonEmpty(section.regionLabel);
      expectNonEmpty(section.heading);
      expectNonEmpty(section.description);
    });

    expectNonEmpty(dashboardContent.hero.eyebrow);
    expectNonEmpty(dashboardContent.account.modeLive);
    expectNonEmpty(dashboardContent.account.modePreview);
    expectNonEmpty(dashboardContent.ticket.contributedPrefix);
    expectNonEmpty(dashboardContent.print.liveChipLabel);
    expectNonEmpty(dashboardContent.print.previewChipLabel);
    expectNonEmpty(dashboardContent.shop.dockableGroupsLabel);
  });

  it("uses unique region labels for clear landmark navigation", () => {
    const labels = [
      dashboardContent.hero.regionLabel,
      dashboardContent.toolbar.regionLabel,
      dashboardContent.account.regionLabel,
      dashboardContent.ticket.regionLabel,
      dashboardContent.print.regionLabel,
      dashboardContent.shop.regionLabel,
      dashboardContent.status.regionLabel,
      dashboardContent.insights.regionLabel,
      dashboardContent.summary.regionLabel,
    ];

    expect(new Set(labels).size).toBe(labels.length);
  });
});
