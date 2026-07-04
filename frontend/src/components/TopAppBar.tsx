import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

export default function TopAppBar() {
  return (
    <header className="app-bar">
      <div className="app-bar-inner">
        <div className="app-bar-brand">
          <span className="app-bar-logo">
            <Icon name="graphic_eq" />
          </span>
          <div>
            <h1 className="app-bar-title">JWST MIRI Spectra Explorer</h1>
            <p className="app-bar-sub">
              Technosignature and biosignature gas search dataset
            </p>
          </div>
        </div>
        <div className="app-bar-spacer" />
        <ThemeToggle />
      </div>
    </header>
  );
}
