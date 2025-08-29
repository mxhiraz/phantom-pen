import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3 p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Voice Note Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The voice note you're looking for doesn't exist or has been deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="sm">
            <Link href="/whispers">Go Home</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/whispers">Create Voice Note</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
