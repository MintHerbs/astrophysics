"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

/**
 * App-bar icon button for the standalone Coverage map route. It toggles: from
 * the dashboard it opens the coverage map, and while on the coverage map it
 * navigates back home. The active styling marks that the coverage map is open.
 */
export default function CoverageNavButton() {
  const pathname = usePathname();
  const active = pathname === "/coverage";
  const href = active ? "/" : "/coverage";
  const label = active ? "Back to the dashboard" : "Coverage map";
  return (
    <Link
      href={href}
      className={`btn-icon${active ? " active" : ""}`}
      aria-label={label}
      title={label}
    >
      <Icon name="travel_explore" />
    </Link>
  );
}
