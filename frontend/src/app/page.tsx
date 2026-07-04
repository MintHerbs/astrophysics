import Dashboard from "@/components/Dashboard";
import { datasets } from "@/lib/data";

export default function Home() {
  return <Dashboard datasets={datasets} />;
}
