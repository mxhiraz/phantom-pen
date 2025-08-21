import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Note Not Found</h1>
          <p className="text-gray-600 max-w-md">
            The note you're looking for doesn't exist or has been deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/whispers">Go Home</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/whispers">Create Note</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
