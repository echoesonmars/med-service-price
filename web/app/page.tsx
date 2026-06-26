import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-linear-to-b from-background to-muted/20">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Med Service Price</h1>
          <p className="text-muted-foreground">
            A clean start for your medical services pricing application.
          </p>
        </div>
        
        <div className="flex justify-center gap-4">
          <Button variant="default">Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </div>
    </main>
  );
}
