// src/app/ui-fix-demo/page.tsx
import VideoSplitForm from "@/components/VideoSplitForm";

export default function Page() {
  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">UI Fix Demo</h1>
      <VideoSplitForm />
    </main>
  );
}