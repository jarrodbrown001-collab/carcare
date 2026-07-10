import { dueItems, todayStr } from './store'

// Browser notifications, fired when the app opens with items due. This is a
// static site with no push server, so notifications can only happen while
// the app is running — an "open the app, get a heads-up" reminder, not true
// background push.
const NOTIFY_KEY = 'carcare-notify'
const LAST_NOTIFIED_KEY = 'carcare-last-notified'

export function notificationsSupported() {
  return typeof Notification !== 'undefined'
}

export function notificationsEnabled() {
  return (
    notificationsSupported() &&
    localStorage.getItem(NOTIFY_KEY) === 'on' &&
    Notification.permission === 'granted'
  )
}

export async function enableNotifications() {
  if (!notificationsSupported()) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false
  localStorage.setItem(NOTIFY_KEY, 'on')
  return true
}

export function disableNotifications() {
  localStorage.setItem(NOTIFY_KEY, 'off')
}

// At most one notification per day, and only when something is actually due.
export function maybeNotifyDue(data) {
  if (!notificationsEnabled()) return
  if (localStorage.getItem(LAST_NOTIFIED_KEY) === todayStr()) return
  const due = dueItems(data)
  if (due.length === 0) return
  const overdue = due.filter((d) => d.status === 'overdue').length
  const body =
    overdue > 0
      ? `${due.length} maintenance item(s) need attention — ${overdue} overdue.`
      : `${due.length} maintenance item(s) due soon.`
  try {
    new Notification('CarCare', { body })
    localStorage.setItem(LAST_NOTIFIED_KEY, todayStr())
  } catch {
    // Some platforms (Android Chrome) require a service worker for
    // page-created notifications — fail silently, the dashboard badge
    // still shows the same info.
  }
}
