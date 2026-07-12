import { TrailerForm } from "@/components/trailers/TrailerForm";

export default function NewTrailerPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Új pótkocsi</h1>
      <TrailerForm />
    </div>
  );
}
