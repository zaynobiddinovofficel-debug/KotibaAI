import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function ExpenseLimitModal({ settings, onSaveSettings }) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    monthlyLimit: settings.monthlyLimit || "",
    warningThreshold: String(settings.warningThreshold || 80),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const threshold = Math.max(1, Math.min(100, Number(form.warningThreshold)))
    onSaveSettings({
      monthlyLimit: form.monthlyLimit,
      warningThreshold: threshold,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">Limit sozlash</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Oylik limit</DialogTitle>
          <DialogDescription>Joriy oy harajatlarini nazorat qiling</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="monthlyLimit">Oylik limit (so'm)</Label>
            <Input
              id="monthlyLimit"
              type="number"
              min="0"
              value={form.monthlyLimit}
              onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
              placeholder="3000000"
            />
          </div>
          <div>
            <Label htmlFor="warningThreshold">Ogohlantirish foizi (%)</Label>
            <Input
              id="warningThreshold"
              type="number"
              min="1"
              max="100"
              value={form.warningThreshold}
              onChange={(e) => setForm({ ...form, warningThreshold: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Saqlash</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
