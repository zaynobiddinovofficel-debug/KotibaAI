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
import { XIcon } from "lucide-react"

export function ExpenseAddModal({ onAddExpense, className }) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    title: "",
    amount: "",
    category: "",
    spentAt: new Date().toISOString().slice(0, 16),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.title.trim()) {
      toast.error("Harajat nomini kiriting")
      return
    }
    if (!amount || amount <= 0) {
      toast.error("Harajat summasini to'g'ri kiriting (0 dan katta)")
      return
    }
    onAddExpense({
      title: form.title.trim(),
      amount,
      category: form.category.trim() || "Boshqa",
      spentAt: new Date(form.spentAt).toISOString(),
    })
    setForm({ title: "", amount: "", category: "", spentAt: new Date().toISOString().slice(0, 16) })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>Harajat qo'shish</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yangi harajat</DialogTitle>
          <DialogDescription>Harajat ma'lumotlarini kiriting</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Nomi</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Masalan: Ovqat"
            />
          </div>
          <div>
            <Label htmlFor="amount">Summa</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="20000"
            />
          </div>
          <div>
            <Label htmlFor="category">Kategoriya</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Transport, Ovqat..."
            />
          </div>
          <div>
            <Label htmlFor="spentAt">Sana va vaqt</Label>
            <Input
              id="spentAt"
              type="datetime-local"
              value={form.spentAt}
              onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Qo'shish</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
