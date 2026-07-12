export const dynamic = "force-dynamic";
import { DriverForm } from "@/components/drivers/DriverForm";

export default function NewDriverPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Új sofőr</h1>
      <DriverForm />
    </div>
  );
}
