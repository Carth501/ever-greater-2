export type DashboardContentSection = {
  regionLabel: string;
  heading: string;
  description: string;
};

export type DashboardContent = {
  mainRegionLabel: string;
  hero: DashboardContentSection & {
    eyebrow: string;
  };
  toolbar: DashboardContentSection;
  account: DashboardContentSection & {
    modeLive: string;
    modePreview: string;
  };
  ticket: DashboardContentSection & {
    contributedPrefix: string;
  };
  print: DashboardContentSection & {
    liveChipLabel: string;
    previewChipLabel: string;
  };
  shop: DashboardContentSection & {
    dockableGroupsLabel: string;
  };
  status: DashboardContentSection;
  insights: DashboardContentSection;
  summary: DashboardContentSection;
};

export const dashboardContent: DashboardContent = {
  mainRegionLabel: "Dashboard preview",
  hero: {
    regionLabel: "Dashboard hero",
    eyebrow: "Dashboard preview: modular operator system",
    heading:
      "A cleaner command center for printing, monitoring, and upgrading without locking the user into one rigid layout.",
    description:
      "This dashboard keeps the current dark MUI foundation, preserves the branded footer, and promotes #4080C0 into a sharper accent system for action, status, and layout emphasis.",
  },
  toolbar: {
    regionLabel: "Panel controls",
    heading: "Panel visibility",
    description:
      "Compose the dashboard around the user's preferred workflow without changing the underlying visual system.",
  },
  account: {
    regionLabel: "Account",
    heading: "Signed in account",
    description: "Current authenticated operator",
    modeLive: "Live data bound",
    modePreview: "Preview fallback active",
  },
  ticket: {
    regionLabel: "Ticket overview",
    heading: "Ticket pool overview",
    description: "Live aggregate ticket metrics",
    contributedPrefix: "Tickets contributed:",
  },
  print: {
    regionLabel: "Print controls",
    heading: "Print controls",
    description:
      "The primary action stays obvious even when more panels are enabled.",
    liveChipLabel: "Live action",
    previewChipLabel: "Preview only",
  },
  shop: {
    regionLabel: "Shop overview",
    heading: "Modular shop surfaces",
    description:
      "Shop groups become independent cards that can be docked together or hidden when the user wants a cleaner print-focused layout.",
    dockableGroupsLabel: "Dockable groups",
  },
  status: {
    regionLabel: "Realtime status",
    heading: "Realtime health",
    description:
      "Compact enough to stay visible, detailed enough to remain useful.",
  },
  insights: {
    regionLabel: "Insights",
    heading: "Secondary insights",
    description:
      "Optional panels can provide guidance without overwhelming the default layout.",
  },
  summary: {
    regionLabel: "Dashboard summary",
    heading: "Why this dashboard works",
    description:
      "The interface feels more intentional because the main action, supporting metrics, and optional panels each have distinct visual weight. The user can simplify the surface without losing the core workflow.",
  },
};
