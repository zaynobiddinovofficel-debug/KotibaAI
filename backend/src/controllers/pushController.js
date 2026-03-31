const db = require('../db')
const webpush = require('web-push')

exports.getVapidKey = async (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
}

exports.subscribe = async (req, res) => {
  try {
    const { subscription } = req.body
    await new Promise((res, rej) => db.users.update({ _id: req.userId }, {
      $set: { 'preferences.pushEnabled': true, 'preferences.pushSubscription': subscription }
    }, {}, (e) => e ? rej(e) : res()))
    res.json({ message: 'Push bildirishnomalar yoqildi' })
  } catch (error) {
    res.status(500).json({ error: 'Serverda xatolik' })
  }
}

exports.unsubscribe = async (req, res) => {
  try {
    await new Promise((res, rej) => db.users.update({ _id: req.userId }, {
      $set: { 'preferences.pushEnabled': false, 'preferences.pushSubscription': null }
    }, {}, (e) => e ? rej(e) : res()))
    res.json({ message: "Push bildirishnomalar o'chirildi" })
  } catch (error) {
    res.status(500).json({ error: 'Serverda xatolik' })
  }
}

exports.testPush = async (req, res) => {
  try {
    const user = await new Promise((res, rej) => db.users.findOne({ _id: req.userId }, (e, d) => e ? rej(e) : res(d)))
    if (!user?.preferences?.pushSubscription) {
      return res.status(400).json({ error: 'Push obuna topilmadi' })
    }

    const payload = JSON.stringify({
      title: 'KotibaAI',
      body: 'Push bildirishnomalar ishlayapti!',
      isVoiceReminder: false
    })

    await webpush.sendNotification(user.preferences.pushSubscription, payload)
    res.json({ message: 'Test bildirishnomasi yuborildi' })
  } catch (error) {
    res.status(500).json({ error: 'Bildirishnoma yuborishda xatolik' })
  }
}
