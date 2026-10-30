import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { Switch, TextArea, TextField, SelectField } from '../../components/ui/Form.jsx';
import { EmptyState, ErrorState, Pagination, Spinner } from '../../components/ui/Feedback.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery } from '../../hooks/useListQuery.js';
import { hasErrors, mapApiErrors } from '../../lib/validate.js';
import { AdminPageHeader, FilterBar, IconButton, RowActions, SearchBox, TableCard } from '../components/AdminUI.jsx';
import { useAction } from '../hooks/useAction.js';

const EMPTY = { customerName: '', rating: 5, message: '', serviceName: '', isPublished: false, displayOrder: 0 };

function TestimonialForm({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item ? { ...EMPTY, ...item, serviceName: item.serviceName || '' } : EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const { run, busy } = useAction();
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const er = {};
    if (form.customerName.trim().length < 2) er.customerName = 'Enter the customer’s name.';
    if (form.message.trim().length < 10) er.message = 'The message needs at least 10 characters.';
    if (!Number.isInteger(Number(form.displayOrder))) er.displayOrder = 'Whole number.';
    setErrors(er);
    if (hasErrors(er)) return;
    setFormError('');
    const payload = {
      customerName: form.customerName.trim(),
      rating: Number(form.rating),
      message: form.message.trim(),
      serviceName: form.serviceName.trim(),
      isPublished: form.isPublished,
      displayOrder: Number(form.displayOrder) || 0,
    };
    const res = await run(() => (item ? adminApi.testimonials.update(item._id, payload) : adminApi.testimonials.create(payload)), {
      success: item ? 'Testimonial updated' : 'Testimonial added',
      onError: (e) => {
        if (e.code === 'VALIDATION_ERROR') setErrors(mapApiErrors(e));
        setFormError(e.message);
      },
    });
    if (res.ok) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? 'Edit testimonial' : 'Add testimonial'}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" form="testimonial-form" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <form id="testimonial-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <p className="rounded-lg bg-cream-100 p-3 text-xs text-ink/65 sm:col-span-2">Only add real reviews from real customers, with their permission. Testimonials stay hidden until you publish them.</p>
        <TextField label="Customer name" required value={form.customerName} onChange={set('customerName')} error={errors.customerName} maxLength={80} />
        <SelectField label="Rating" value={form.rating} onChange={set('rating')} error={errors.rating}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
        </SelectField>
        <TextArea label="Review" required className="sm:col-span-2" rows={4} value={form.message} onChange={set('message')} error={errors.message} maxLength={1000} hint={`${form.message.length}/1000`} />
        <TextField label="Service (optional)" value={form.serviceName} onChange={set('serviceName')} error={errors.serviceName} maxLength={100} />
        <TextField label="Display order" type="number" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} />
        <div className="sm:col-span-2"><Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Published on the website" /></div>
        {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 sm:col-span-2" role="alert">{formError}</p>}
      </form>
    </Modal>
  );
}

export default function TestimonialsPage() {
  const { query, setFilter, setPage } = useListQuery({ sort: 'displayOrder', isPublished: '', rating: '', search: '' });
  const { data, meta, loading, error, reload } = useApi((signal) => adminApi.testimonials.list(query, signal), [JSON.stringify(query)]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { run, busy } = useAction();
  const rows = data || [];

  const toggle = (t) => run(() => adminApi.testimonials.update(t._id, { isPublished: !t.isPublished }), { success: t.isPublished ? 'Unpublished' : 'Published' }).then((r) => r.ok && reload());
  const remove = async () => {
    const r = await run(() => adminApi.testimonials.remove(deleting._id), { success: 'Testimonial deleted' });
    if (r.ok) {
      setDeleting(null);
      reload();
    }
  };

  return (
    <>
      <AdminPageHeader title="Testimonials" subtitle="Only published testimonials appear on the website." actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={14} /> Add testimonial</button>} />
      <FilterBar>
        <SearchBox value={query.search} onChange={(v) => setFilter('search', v)} placeholder="Search testimonials" className="w-full sm:w-60" />
        <select className="input w-auto" value={query.isPublished} onChange={(e) => setFilter('isPublished', e.target.value)} aria-label="Visibility">
          <option value="">Published & hidden</option>
          <option value="true">Published only</option>
          <option value="false">Hidden only</option>
        </select>
        <select className="input w-auto" value={query.rating} onChange={(e) => setFilter('rating', e.target.value)} aria-label="Rating">
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
        <select className="input w-auto" value={query.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          <option value="displayOrder">Display order</option>
          <option value="-createdAt">Newest</option>
          <option value="-rating">Highest rating</option>
          <option value="rating">Lowest rating</option>
        </select>
      </FilterBar>

      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !rows.length && <Spinner className="h-7 w-7" />}
      {!loading && !error && !rows.length && <EmptyState title="No testimonials yet">Add real customer reviews and publish them to show them on the website.</EmptyState>}

      {rows.length > 0 && (
        <TableCard>
          <thead className="border-b border-gold-300/70 bg-cream-100">
            <tr><th className="th">Customer</th><th className="th">Rating</th><th className="th">Review</th><th className="th">Published</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-gold-300/50">
            {rows.map((t) => (
              <tr key={t._id} className="hover:bg-cream-100/70">
                <td className="td"><p className="font-medium">{t.customerName}</p>{t.serviceName && <p className="text-xs text-ink/55">{t.serviceName}</p>}</td>
                <td className="td whitespace-nowrap text-gold-500">{'★'.repeat(t.rating)}</td>
                <td className="td max-w-md"><p className="line-clamp-2 text-ink/75">{t.message}</p></td>
                <td className="td"><Switch checked={t.isPublished} onChange={() => toggle(t)} disabled={busy} /></td>
                <td className="td"><RowActions><IconButton icon="edit" label="Edit" onClick={() => setEditing(t)} /><IconButton icon="trash" label="Delete" danger onClick={() => setDeleting(t)} /></RowActions></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <Pagination meta={meta} onPage={setPage} className="mt-4" />

      {editing && (
        <TestimonialForm
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} busy={busy} onClose={() => setDeleting(null)} onConfirm={remove} message={deleting ? `Delete the testimonial from ${deleting.customerName}? This cannot be undone.` : ''} />
    </>
  );
}
