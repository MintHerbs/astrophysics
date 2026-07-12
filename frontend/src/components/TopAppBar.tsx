import Link from "next/link";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import CoverageNavButton from "./CoverageNavButton";

export default function TopAppBar() {
  return (
    <header className="app-bar">
      <div className="app-bar-inner">
        <Link href="/" className="app-bar-brand" aria-label="JWST MIRI Spectra Explorer, home">
          <span className="app-bar-logo">
            <Icon name="graphic_eq" />
          </span>
          <div>
            <h1 className="app-bar-title">JWST MIRI Spectra Explorer</h1>
            <p className="app-bar-sub">
              Technosignature and biosignature gas search dataset
            </p>
          </div>
        </Link>
        <div className="app-bar-spacer" />
        <CoverageNavButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
