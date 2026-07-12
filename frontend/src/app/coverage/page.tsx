import type { Metadata } from "next";
import CoverageView from "@/components/CoverageView";

export const metadata: Metadata = {
  title: "Coverage map | JWST MIRI Spectra Explorer",
  description:
    "Telescope wavelength coverage against the absorption bands of the target technosignature and " +
    "biosignature gases, on one shared logarithmic wavelength axis.",
};

export default function CoveragePage() {
  return <CoverageView />;
}
