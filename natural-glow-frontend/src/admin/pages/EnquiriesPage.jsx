import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { EmptyState, ErrorState, Pagination, Spinner, StatusBadge } from '../../components/ui/Feedback.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery } from '../../hooks/useListQuery.js';
import { ENQUIRY_STATUSES } from '../../lib/constants.js';
import { formatDateTime } from '../../lib/format.js';
import { AdminPageHeader, FilterBar, IconButton, RowActions, SearchBox, TableCard } from '../components/AdminUI.jsx';
import { useAction } from '../hooks/useAction.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function EnquiriesPage() {
  const { query, setFilter, setPage } = useListQuery({ sort: '-createdAt', status: '', search: '' });
  const { data, meta, loading, error, reload } = useApi((signal) => adminApi.enquiries.list(query, signal), [JSON.stringify(query)]);
  const [open, setOpen] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { run, busy } = useAction();
  const rows = data || [];

  const setStatus = async (enquiry, status) => {
    const r = await run(() => adminApi.enquiries.updateStatus(enquiry._id, status), { success: `Marked as ${status}` });
    if (r.ok) {
      setOpen((o) => (o && o._id === enquiry._id ? { ...o, status } : o));
      reload();
    }
  };
  // Opening a "new" enquiry marks it as read.
  const view = (e) => {
    setOpen(e);
    if (e.status === 'new') setStatus(e, 'read');
  };
  const remove = async () => {
    const r = await run(() => adminApi.enquiries.remove(deleting._id), { success: 'Enquiry deleted' });
    if (r.ok) {
      setDeleting(null);
      setOpen(null);
      reload();
    }
  };

  return (
    <>
      <AdminPageHeader title="Enquiries" subtitle="Messages from the website contact form." />
      <FilterBar>
        <SearchBox value={query.search} onChange={(v) => setFilter('search', v)} placeholder="Search name, email, phone or subject" className="w-full sm:w-72" />
        <select className="input w-auto" value={query.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {ENQUIRY_STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
        </select>
        <select className="input w-auto" value={query.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
        </select>
      </FilterBar>

      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !rows.length && <Spinner className="h-7 w-7" />}
      {!loading && !error && !rows.length && <EmptyState title="No enquiries">Messages sent from the contact form will appear here.</EmptyState>}

      {rows.length > 0 && (
        <TableCard>
          <thead className="border-b border-gold-300/70 bg-cream-100">
            <tr><th className="th">From</th><th className="th">Subject</th><th className="th">Message</th><th className="th">Status</th><th className="th">Received</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-gold-300/50">
            {rows.map((e) => (
              <tr key={e._id} className={`cursor-pointer hover:bg-cream-100/70 ${e.status === 'new' ? 'font-medium' : ''}`} onClick={() => view(e)}>
                <td className="td"><p>{e.name}</p><p className="text-xs font-normal text-ink/55">{e.email || e.phone}</p></td>
                <td className="td">{e.subject || <span className="text-ink/40">—</span>}</td>
                <td className="td max-w-xs"><p className="line-clamp-1 font-normal text-ink/70">{e.message}</p></td>
                <td className="td"><StatusBadge status={e.status} /></td>
                <td className="td whitespace-nowrap text-xs font-normal text-ink/60">{formatDateTime(e.createdAt)}</td>
                <td className="td" onClick={(ev) => ev.stopPropagation()}><RowActions><IconButton icon="trash" label="Delete" danger onClick={() => setDeleting(e)} /></RowActions></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <Pagination meta={meta} onPage={setPage} className="mt-4" />

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.subject || 'Enquiry'} footer={open && <button className="btn btn-outline btn-sm" onClick={() => setOpen(null)}>Close</button>}>
        {open && (
          <div className="space-y-4 text-sm">
            <dl className="space-y-1.5">
              <div className="flex justify-between gap-4"><dt className="text-ink/60">From</dt><dd className="font-medium">{open.name}</dd></div>
              {open.email && <div className="flex justify-between gap-4"><dt className="text-ink/60">Email</dt><dd><a className="break-all text-olive-800 hover:underline" href={`mailto:${open.email}`}>{open.email}</a></dd></div>}
              {open.phone && <div className="flex justify-between gap-4"><dt className="text-ink/60">Phone</dt><dd><a className="text-olive-800 hover:underline" href={`tel:${open.phone}`}>{open.phone}</a></dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-ink/60">Received</dt><dd>{formatDateTime(open.createdAt)}</dd></div>
            </dl>
            <p className="whitespace-pre-wrap rounded-xl bg-cream-100 p-4 leading-relaxed">{open.message}</p>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/55">Status</p>
              <div className="flex flex-wrap gap-2">
                {ENQUIRY_STATUSES.map((s) => (
                  <button key={s} disabled={busy || open.status === s} onClick={() => setStatus(open, s)} className={`chip ${open.status === s ? 'chip-active' : ''}`}>{cap(s)}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} busy={busy} onClose={() => setDeleting(null)} onConfirm={remove} message={deleting ? `Delete the enquiry from ${deleting.name}? This cannot be undone.` : ''} />
    </>
  );
}
