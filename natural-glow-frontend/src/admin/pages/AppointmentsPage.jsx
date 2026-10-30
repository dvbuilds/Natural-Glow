import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { SelectField, TextArea, TextField } from '../../components/ui/Form.jsx';
import { EmptyState, ErrorState, Pagination, Spinner, StatusBadge } from '../../components/ui/Feedback.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery } from '../../hooks/useListQuery.js';
import { APPOINTMENT_STATUSES, STATUS_TRANSITIONS } from '../../lib/constants.js';
import { addDaysIst, digitsOnly, formatDateTime, formatPrice, istDateString, whatsappLink } from '../../lib/format.js';
import { hasErrors, mapApiErrors } from '../../lib/validate.js';
import { AdminPageHeader, FilterBar, IconButton, RowActions, SearchBox, TableCard } from '../components/AdminUI.jsx';
import { useAction } from '../hooks/useAction.js';

const SORTS = [
  { value: '-createdAt', label: 'Newest requests' },
  { value: 'createdAt', label: 'Oldest requests' },
  { value: 'preferredAt', label: 'Preferred time: soonest' },
  { value: '-preferredAt', label: 'Preferred time: latest' },
];

// wa.me needs a country code; a bare 10-digit number is assumed to be Indian (+91).
const customerWhatsApp = (phone, text) => {
  const d = digitsOnly(phone);
  return whatsappLink(d.length === 10 ? `91${d}` : d, text);
};

function ManageModal({ appointment, onClose, onChanged }) {
  const allowed = STATUS_TRANSITIONS[appointment.status] || [];
  const [form, setForm] = useState({ status: allowed[0] || '', note: '', adminNotes: appointment.adminNotes || '', newDate: '', newTime: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const { run, busy } = useAction();

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async () => {
    const er = {};
    if (!form.status) er.status = 'Choose a status.';
    if (form.status === 'rescheduled') {
      if (!form.newDate) er.newDate = 'Choose the new date.';
      else if (form.newDate < istDateString()) er.newDate = 'The new date cannot be in the past.';
      if (!form.newTime) er.newTime = 'Choose the new time.';
    }
    setErrors(er);
    if (hasErrors(er)) return;

    const body = {
      status: form.status,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
      adminNotes: form.adminNotes.trim(),
      ...(form.status === 'rescheduled' ? { newDate: form.newDate, newTime: form.newTime } : {}),
    };
    setFormError('');
    const res = await run(() => adminApi.appointments.updateStatus(appointment._id, body), {
      success: `Marked as ${form.status}`,
      onError: (e) => {
        if (e.code === 'VALIDATION_ERROR') setErrors(mapApiErrors(e));
        setFormError(e.message); // INVALID_STATUS_TRANSITION, PREFERRED_TIME_TOO_SOON, SALON_CLOSED, OUTSIDE_WORKING_HOURS …
      },
    });
    if (res.ok) {
      onChanged(res.result.data);
    }
  };

  const wa = customerWhatsApp(
    appointment.phone,
    `Hello ${appointment.customerName}, this is about your appointment request for ${appointment.serviceName} on ${formatDateTime(appointment.preferredAt)}.`
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Appointment request"
      size="lg"
      footer={
        <>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
          {allowed.length > 0 && <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Update status'}</button>}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Customer</dt><dd className="font-medium">{appointment.customerName}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Phone</dt><dd><a className="text-olive-800 hover:underline" href={`tel:${appointment.phone}`}>{appointment.phone}</a></dd></div>
            {appointment.email && <div className="flex justify-between gap-4"><dt className="text-ink/60">Email</dt><dd><a className="break-all text-olive-800 hover:underline" href={`mailto:${appointment.email}`}>{appointment.email}</a></dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Service (at request time)</dt><dd className="text-right font-medium">{appointment.serviceName}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Price (snapshot)</dt><dd className="font-medium">{formatPrice(appointment.servicePrice)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Preferred time</dt><dd className="text-right font-medium">{formatDateTime(appointment.preferredAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Received</dt><dd>{formatDateTime(appointment.createdAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Status</dt><dd><StatusBadge status={appointment.status} /></dd></div>
          </dl>
          {appointment.notes && (
            <div className="mt-4 rounded-xl bg-cream-100 p-3 text-sm"><p className="text-xs text-ink/55">Customer notes</p><p className="mt-1 whitespace-pre-wrap">{appointment.notes}</p></div>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-4"><Icon name="whatsapp" size={14} /> WhatsApp customer</a>
          )}

          <h3 className="mt-6 font-serif text-lg">History</h3>
          <ol className="mt-2 space-y-2 border-l border-gold-300 pl-4 text-sm">
            {(appointment.statusHistory || []).map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-olive-600" />
                <StatusBadge status={h.status} /> <span className="text-xs text-ink/55">{formatDateTime(h.at)}</span>
                {h.preferredAt && <p className="text-xs text-ink/55">For {formatDateTime(h.preferredAt)}</p>}
                {h.note && <p className="text-xs">{h.note}</p>}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="font-serif text-lg">Update</h3>
          {allowed.length === 0 ? (
            <p className="mt-2 rounded-xl bg-cream-100 p-3 text-sm text-ink/70">This request is {appointment.status}. It is final and can no longer be changed.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <SelectField label="New status" value={form.status} onChange={set('status')} error={errors.status}>
                {allowed.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </SelectField>
              {form.status === 'rescheduled' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="New date" type="date" min={istDateString()} value={form.newDate} onChange={set('newDate')} error={errors.newDate} />
                  <TextField label="New time" type="time" value={form.newTime} onChange={set('newTime')} error={errors.newTime} />
                </div>
              )}
              <TextField label="History note (optional)" value={form.note} onChange={set('note')} error={errors.note} maxLength={300} placeholder="e.g. Called customer" />
              <TextArea label="Internal notes (optional)" rows={3} value={form.adminNotes} onChange={set('adminNotes')} error={errors.adminNotes} maxLength={500} />
              <p className="text-xs text-ink/55">Allowed from “{appointment.status}”: {allowed.join(', ')}. Cancelled and completed are final.</p>
              {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function AppointmentsPage() {
  const { query, setFilter, setPage } = useListQuery({ sort: '-createdAt', status: '', serviceId: '', from: '', to: '', search: '' });
  const { data, meta, loading, error, reload } = useApi((signal) => adminApi.appointments.list(query, signal), [JSON.stringify(query)]);
  const { data: services } = useApi((signal) => adminApi.services.list({ limit: 100, sort: 'name' }, signal), []);
  const [selected, setSelected] = useState(null);
  const { run, busy } = useAction();
  const rows = data || [];

  // Keep the open modal in sync if the list reloads
  useEffect(() => {
    if (selected) {
      const fresh = rows.find((r) => r._id === selected._id);
      if (fresh && fresh.updatedAt !== selected.updatedAt) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const quickConfirm = (a) =>
    run(() => adminApi.appointments.updateStatus(a._id, { status: 'confirmed' }), { success: 'Appointment confirmed' }).then((r) => r.ok && reload());

  return (
    <>
      <AdminPageHeader title="Appointments" subtitle="Requests from the website. Nothing is reserved until you confirm it." actions={<button className="btn btn-outline btn-sm" onClick={reload}><Icon name="refresh" size={14} /> Refresh</button>} />

      <FilterBar>
        <SearchBox value={query.search} onChange={(v) => setFilter('search', v)} placeholder="Search name, phone or service" className="w-full sm:w-64" />
        <select className="input w-auto" value={query.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="input w-auto" value={query.serviceId} onChange={(e) => setFilter('serviceId', e.target.value)} aria-label="Service">
          <option value="">All services</option>
          {(services || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink/70">From <input type="date" className="input w-auto" value={query.from} max={query.to || undefined} onChange={(e) => setFilter('from', e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm text-ink/70">To <input type="date" className="input w-auto" value={query.to} min={query.from || undefined} onChange={(e) => setFilter('to', e.target.value)} /></label>
        <select className="input w-auto" value={query.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(query.status || query.serviceId || query.from || query.to || query.search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => ['status', 'serviceId', 'from', 'to', 'search'].forEach((k) => setFilter(k, ''))}>Clear filters</button>
        )}
      </FilterBar>

      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !rows.length && <Spinner className="h-7 w-7" />}
      {!loading && !error && !rows.length && <EmptyState title="No appointments found">Requests sent from the website will appear here.</EmptyState>}

      {rows.length > 0 && (
        <TableCard>
          <thead className="border-b border-gold-300/70 bg-cream-100">
            <tr><th className="th">Customer</th><th className="th">Service</th><th className="th">Preferred time</th><th className="th">Status</th><th className="th">Received</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-gold-300/50">
            {rows.map((a) => (
              <tr key={a._id} className="hover:bg-cream-100/70">
                <td className="td"><p className="font-medium">{a.customerName}</p><p className="text-xs text-ink/55">{a.phone}</p></td>
                <td className="td"><p>{a.serviceName}</p><p className="text-xs text-ink/55">{formatPrice(a.servicePrice)}</p></td>
                <td className="td whitespace-nowrap">{formatDateTime(a.preferredAt)}</td>
                <td className="td"><StatusBadge status={a.status} /></td>
                <td className="td whitespace-nowrap text-xs text-ink/60">{formatDateTime(a.createdAt)}</td>
                <td className="td">
                  <RowActions>
                    {a.status === 'pending' && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => quickConfirm(a)}>Confirm</button>}
                    <IconButton icon="eye" label="Manage" onClick={() => setSelected(a)} />
                  </RowActions>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <Pagination meta={meta} onPage={setPage} className="mt-4" />

      {selected && (
        <ManageModal
          key={selected._id + selected.updatedAt}
          appointment={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => {
            setSelected(updated);
            reload();
          }}
        />
      )}
    </>
  );
}
