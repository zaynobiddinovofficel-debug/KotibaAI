import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">shadcn/ui ulandi</p>
        <h1 className="text-3xl font-semibold tracking-tight">Web app tayyor</h1>
        <Button>Test button</Button>
      </div>
    </main>
  )
}
