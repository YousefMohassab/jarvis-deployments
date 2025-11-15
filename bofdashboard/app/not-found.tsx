'use client';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">404 - Not Found</h2>
        <p className="text-muted-foreground">Could not find requested resource</p>
      </div>
    </div>
  );
}
