const schedule = require('node-schedule');
const prisma = require('../db');

// Lazy import to avoid circular dependency
function getSendReminderFired() {
  try {
    return require('../routes/notifications').sendReminderFired;
  } catch { return null; }
}

const scheduledJobs = new Map();

function scheduleReminder(reminder) {
  if (!reminder || !reminder.date) return;

  // Combine date + time fields into the actual scheduled moment
  const remindDate = new Date(reminder.date);
  if (reminder.time) {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    remindDate.setHours(hours, minutes, 0, 0);
  }

  if (remindDate <= new Date()) return;

  const jobId = reminder.id;
  if (scheduledJobs.has(jobId)) scheduledJobs.get(jobId).cancel();

  const job = schedule.scheduleJob(remindDate, async () => {
    try {
      const fresh = await prisma.reminder.findUnique({ where: { id: jobId } });
      if (!fresh || fresh.status !== 'active') return;

      console.log(`[REMINDER] Eslatma: ${fresh.text}`);

      await prisma.reminder.update({
        where: { id: jobId },
        data: { status: 'completed' },
      });

      // SSE orqali frontendga xabar yuborish
      const sendFn = getSendReminderFired();
      if (sendFn) sendFn(fresh.userId, fresh);

      scheduledJobs.delete(jobId);
    } catch (err) {
      console.error('Reminder job error:', err.message);
    }
  });

  scheduledJobs.set(jobId, job);
}

function cancelReminder(id) {
  if (scheduledJobs.has(id)) {
    scheduledJobs.get(id).cancel();
    scheduledJobs.delete(id);
  }
}

async function restoreScheduledReminders() {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { status: 'active', date: { gt: new Date() } },
    });
    reminders.forEach(scheduleReminder);
    console.log(`Restored ${reminders.length} scheduled reminders`);
  } catch (err) {
    console.error('Error restoring reminders:', err.message);
  }
}

module.exports = { scheduleReminder, cancelReminder, restoreScheduledReminders };
