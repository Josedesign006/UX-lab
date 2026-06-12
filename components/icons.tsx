import { StudyType } from "@/lib/types";

type IconProps = { className?: string; strokeWidth?: number };

function Base({
  children,
  className = "w-5 h-5",
  strokeWidth = 1.75,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ---------- study type icons ---------- */

export const IconCards = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="7" height="9" rx="1.5" />
    <rect x="14" y="4" width="7" height="6" rx="1.5" />
    <rect x="3" y="17" width="7" height="3" rx="1.5" />
    <rect x="14" y="14" width="7" height="6" rx="1.5" />
  </Base>
);

export const IconTree = (p: IconProps) => (
  <Base {...p}>
    <circle cx="6" cy="5" r="2.2" />
    <circle cx="6" cy="19" r="2.2" />
    <circle cx="18" cy="12" r="2.2" />
    <path d="M6 7.2v9.6" />
    <path d="M6 12h6.5a3 3 0 0 0 3-0" />
    <path d="M8.2 5H13a3 3 0 0 1 3 3v1.8" />
  </Base>
);

export const IconTarget = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Base>
);

export const IconClipboard = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5v1" />
    <path d="M9 10h6M9 14h6M9 18h3.5" />
  </Base>
);

export const IconPhone = (p: IconProps) => (
  <Base {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
    <path d="M10 6.5l2.5 2.5 4-4.5" />
  </Base>
);

export const IconFlask = (p: IconProps) => (
  <Base {...p}>
    <path d="M9.5 3h5" />
    <path d="M10.5 3v5.2L5.6 17a3 3 0 0 0 2.7 4.5h7.4a3 3 0 0 0 2.7-4.5l-4.9-8.8V3" />
    <path d="M7.5 14.5h9" />
  </Base>
);

export function StudyTypeIcon({
  type,
  className,
  strokeWidth,
}: { type: StudyType } & IconProps) {
  const map: Record<StudyType, (p: IconProps) => JSX.Element> = {
    "card-sort": IconCards,
    "tree-test": IconTree,
    "first-click": IconTarget,
    survey: IconClipboard,
    prototype: IconPhone,
    usability: IconFlask,
  };
  const C = map[type];
  return <C className={className} strokeWidth={strokeWidth} />;
}

/** Black rounded tile with a lime study-type glyph. */
export function TypeTile({
  type,
  size = "md",
}: {
  type: StudyType;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg"
      ? "w-14 h-14 rounded-2xl"
      : size === "sm"
        ? "w-9 h-9 rounded-xl"
        : "w-11 h-11 rounded-xl";
  const icon =
    size === "lg" ? "w-7 h-7" : size === "sm" ? "w-[18px] h-[18px]" : "w-[22px] h-[22px]";
  return (
    <span className={`${cls} bg-ink text-lime grid place-items-center shrink-0`}>
      <StudyTypeIcon type={type} className={icon} />
    </span>
  );
}

/* ---------- UI icons ---------- */

export const IconArrowRight = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 12h16M13 5l7 7-7 7" />
  </Base>
);

export const IconArrowLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 12H4M11 5l-7 7 7 7" />
  </Base>
);

export const IconPlay = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.5-7.2a.8.8 0 0 0 0-1.4L8.2 4.1a.8.8 0 0 0-1.2.7Z" />
  </Base>
);

export const IconStop = (p: IconProps) => (
  <Base {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </Base>
);

export const IconChart = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20h16" />
    <path d="M6.5 16.5v-5M11 16.5V7M15.5 16.5v-3M20 16.5V4.5" strokeWidth={2.2} />
  </Base>
);

export const IconEye = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
);

export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
    <path d="M6.5 7l1 13a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l1-13" />
  </Base>
);

export const IconDownload = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5v11M7 10l5 5 5-5" />
    <path d="M4.5 20.5h15" />
  </Base>
);

export const IconCopy = (p: IconProps) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 12.5l5 5L19.5 6.5" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconUsers = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.4a3.2 3.2 0 0 1 0 5.8M17.8 14.6a5.5 5.5 0 0 1 2.7 5.4" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Base>
);

export const IconLock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
  </Base>
);

export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" />
    <path d="M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5" />
  </Base>
);

export const IconLink = (p: IconProps) => (
  <Base {...p}>
    <path d="M10 14a5 5 0 0 0 7.1 0l2.4-2.4a5 5 0 0 0-7.1-7.1l-1.2 1.2" />
    <path d="M14 10a5 5 0 0 0-7.1 0l-2.4 2.4a5 5 0 0 0 7.1 7.1l1.2-1.2" />
  </Base>
);

export const IconSparkle = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z" />
    <path d="M19 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
  </Base>
);
