import { TruckForm } from "@/components/trucks/TruckForm";

export default function NewTruckPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Új vontató</h1>
      <TruckForm />
    </div>
  );
}
