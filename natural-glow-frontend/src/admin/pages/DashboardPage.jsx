import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { ErrorState, Spinner, StatusBadge } from '../../components/ui/Feedback.jsx';
import { useApi } from '../../hooks/useApi.js';
import { APPOINTMENT_STATUSES } from '../../lib/constants.js';
import { formatDateTime } from '../../lib/format.js';
import { AdminPageHeader } from '../components/AdminUI.jsx';

function Stat({ label, value, sub, to }) {
  const body = (
    <div className="card h-full p-5 transition hover:bg-cream-200/60">
      <p className="text-xs uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-2 font-serif text-4xl text-olive-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink/55">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function DashboardPage() {
  const { data: d, loading, error, reload } = useApi((signal) => adminApi.dashboard(signal), []);

  return (
    <>
      <AdminPageHeader title="Dashboard" subtitle="Overview of requests and content" actions={<button className="btn btn-outline btn-sm" onClick={reload}>Refresh</button>} />
      {loading && !d && <Spinner className="h-7 w-7" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {d && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Pending requests" value={d.appointments.pendingRequests} sub="Waiting for confirmation" to="/admin/appointments" />
            <Stat label="Today" value={d.appointments.today} sub="Active requests for today (IST)" to="/admin/appointments" />
            <Stat label="Upcoming" value={d.appointments.upcoming} sub="Pending, confirmed or rescheduled" to="/admin/appointments" />
            <Stat label="New enquiries" value={d.enquiries.new} sub="Unread messages" to="/admin/enquiries" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card p-5 lg:col-span-1">
              <h2 className="font-serif text-xl">Appointments by status</h2>
              <ul className="mt-4 space-y-3">
                {APPOINTMENT_STATUSES.map((s) => {
                  const n = d.appointments.byStatus[s] ?? 0;
                  const pct = d.appointments.total ? Math.round((n / d.appointments.total) * 100) : 0;
                  return (
                    <li key={s}>
                      <div className="flex items-center justify-between text-sm">
                        <StatusBadge status={s} />
                        <span className="font-medium">{n}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-sage-100"><div className="h-full rounded-full bg-olive-600" style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-ink/55">{d.appointments.total} in total</p>
            </section>

            <section className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">Recent appointment requests</h2>
                <Link to="/admin/appointments" className="text-sm text-olive-700 hover:underline">View all</Link>
              </div>
              {d.recent.appointments.length === 0 ? (
                <p className="mt-4 text-sm text-ink/60">No requests yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-gold-300/60">
                  {d.recent.appointments.map((a) => (
                    <li key={a._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.customerName}</p>
                        <p className="truncate text-xs text-ink/55">{a.serviceName} · {formatDateTime(a.preferredAt)}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Services" value={d.services.active} sub={`${d.services.inactive} inactive`} to="/admin/services" />
            <Stat label="Offers" value={d.offers.active} sub={`${d.offers.inactive} inactive`} to="/admin/offers" />
            <Stat label="Testimonials" value={d.testimonials.published} sub={`${d.testimonials.unpublished} unpublished`} to="/admin/testimonials" />
            <Stat label="Gallery images" value={d.gallery.total} to="/admin/gallery" />
          </div>

          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Recent enquiries</h2>
              <Link to="/admin/enquiries" className="text-sm text-olive-700 hover:underline">View all</Link>
            </div>
            {d.recent.enquiries.length === 0 ? (
              <p className="mt-4 text-sm text-ink/60">No enquiries yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gold-300/60">
                {d.recent.enquiries.map((e) => (
                  <li key={e._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.name}</p>
                      <p className="truncate text-xs text-ink/55">{e.subject || 'No subject'} · {formatDateTime(e.createdAt)}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
