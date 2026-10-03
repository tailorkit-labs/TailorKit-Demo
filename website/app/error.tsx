"use client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col gap-4">
        <Alert variant="error">
          <AlertTitle>We couldn’t open your workspace</AlertTitle>
          <AlertDescription>
            Please try again in a moment. Your saved records are safe.
          </AlertDescription>
        </Alert>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
