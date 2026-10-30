import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { Field, SelectField, Switch, TextArea, TextField } from '../../components/ui/Form.jsx';
import { EmptyState, ErrorState, Pagination, Spinner, StatusBadge } from '../../components/ui/Feedback.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery } from '../../hooks/useListQuery.js';
import { OFFER_TYPES, label } from '../../lib/constants.js';
import { formatDate, formatPrice, fromIstInput, toIstInput } from '../../lib/format.js';
import { hasErrors, isHttpsUrl, mapApiErrors } from '../../lib/validate.js';
import { AdminPageHeader, FilterBar, FormSection, IconButton, RowActions, SearchBox, TableCard } from '../components/AdminUI.jsx';
import { useAction } from '../hooks/useAction.js';

const EMPTY = {
  title: '', type: 'offer', description: '', inclusions: [], originalPrice: '', offerPrice: '', validFrom: '', validUntil: '',
  applicableServices: [], imageUrl: '', isActive: true, isFeatured: false, displayOrder: 0, seoTitle: '', seoDescription: '',
};

const toForm = (o) => ({
  ...EMPTY,
  ...o,
  description: o.description || '',
  inclusions: o.inclusions || [],
  originalPrice: o.originalPrice ?? '',
  offerPrice: o.offerPrice ?? '',
  validFrom: toIstInput(o.validFrom),
  validUntil: toIstInput(o.validUntil),
  applicableServices: (o.applicableServices || []).map(String),
  imageUrl: o.imageUrl || '',
  seoTitle: o.seoTitle || '',
  seoDescription: o.seoDescription || '',
});

function validate(f) {
  const e = {};
  if (f.title.trim().length < 2) e.title = 'Title must be at least 2 characters.';
  if (f.offerPrice === '' || Number(f.offerPrice) < 0) e.offerPrice = 'Enter an offer price of 0 or more.';
  if (f.originalPrice !== '' && Number(f.originalPrice) < 0) e.originalPrice = 'Must be 0 or more.';
  if (f.originalPrice !== '' && f.offerPrice !== '' && Number(f.offerPrice) > Number(f.originalPrice)) e.offerPrice = 'The offer price cannot be higher than the original price.';
  if (f.validFrom && f.validUntil && f.validUntil < f.validFrom) e.validUntil = 'Must be after the start date.';
  if (f.imageUrl.trim() && !isHttpsUrl(f.imageUrl.trim())) e.imageUrl = 'Must be a full https:// URL.';
  if (f.inclusions.some((i) => i.length > 120)) e.inclusions = 'Each item can be at most 120 characters.';
  return e;
}

// On edit, empty optional values are sent as null so they are cleared on the server.
const toPayload = (f, isEdit) => {
  const nullable = (v, conv) => (v === '' ? (isEdit ? null : undefined) : conv(v));
  const p = {
    title: f.title.trim(),
    type: f.type,
    description: f.description.trim(),
    inclusions: f.inclusions.map((i) => i.trim()).filter(Boolean),
    originalPrice: nullable(f.originalPrice, Number),
    offerPrice: Number(f.offerPrice),
    validFrom: nullable(f.validFrom, fromIstInput),
    validUntil: nullable(f.validUntil, fromIstInput),
    applicableServices: f.applicableServices,
    imageUrl: f.imageUrl.trim(),
    isActive: f.isActive,
    isFeatured: f.isFeatured,
    displayOrder: Number(f.displayOrder) || 0,
    seoTitle: f.seoTitle.trim(),
    seoDescription: f.seoDescription.trim(),
  };
  return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined));
};

function OfferForm({ offer, services, onClose, onSaved }) {
  const [form, setForm] = useState(offer ? toForm(offer) : EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const { run, busy } = useAction();
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const setInclusion = (i, v) => setForm((f) => ({ ...f, inclusions: f.inclusions.map((x, idx) => (idx === i ? v : x)) }));
  const toggleService = (id) =>
    setForm((f) => ({ ...f, applicableServices: f.applicableServices.includes(id) ? f.applicableServices.filter((x) => x !== id) : [...f.applicableServices, id] }));

  const submit = async (ev) => {
    ev.preventDefault();
    const er = validate(form);
    setErrors(er);
    if (hasErrors(er)) return;
    setFormError('');
    const payload = toPayload(form, Boolean(offer));
    const res = await run(() => (offer ? adminApi.offers.update(offer._id, payload) : adminApi.offers.create(payload)), {
      success: offer ? 'Offer updated' : 'Offer created',
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
      title={offer ? 'Edit offer / package' : 'Add offer / package'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" form="offer-form" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <form id="offer-form" onSubmit={submit} noValidate className="space-y-5">
        <FormSection title="Basics">
          <TextField label="Title" required className="sm:col-span-2" value={form.title} onChange={set('title')} error={errors.title} maxLength={120} />
          <SelectField label="Type" value={form.type} onChange={set('type')} error={errors.type}>
            {OFFER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </SelectField>
          <TextField label="Image URL" placeholder="https://…" value={form.imageUrl} onChange={set('imageUrl')} error={errors.imageUrl} />
          <TextArea label="Description" className="sm:col-span-2" rows={3} value={form.description} onChange={set('description')} error={errors.description} maxLength={1000} />
        </FormSection>

        <FormSection title="Price & validity">
          <TextField label="Original price (₹)" type="number" min="0" value={form.originalPrice} onChange={set('originalPrice')} error={errors.originalPrice} hint="Optional. Used to show the discount." />
          <TextField label="Offer price (₹)" required type="number" min="0" value={form.offerPrice} onChange={set('offerPrice')} error={errors.offerPrice} />
          <TextField label="Valid from (IST)" type="datetime-local" value={form.validFrom} onChange={set('validFrom')} error={errors.validFrom} hint="Leave empty to start immediately." />
          <TextField label="Valid until (IST)" type="datetime-local" value={form.validUntil} onChange={set('validUntil')} error={errors.validUntil} hint="Leave empty for no end date. Expired offers hide automatically." />
        </FormSection>

        <fieldset className="rounded-xl border border-gold-300/70 p-4">
          <legend className="px-2 text-sm font-medium text-olive-800">What’s included</legend>
          <div className="space-y-2">
            {form.inclusions.map((inc, i) => (
              <div key={i} className="flex gap-2">
                <input className="input" value={inc} maxLength={120} onChange={(e) => setInclusion(i, e.target.value)} aria-label={`Inclusion ${i + 1}`} />
                <IconButton icon="x" label="Remove" onClick={() => setForm((f) => ({ ...f, inclusions: f.inclusions.filter((_, idx) => idx !== i) }))} />
              </div>
            ))}
            {errors.inclusions && <p className="text-xs text-red-700">{errors.inclusions}</p>}
            {form.inclusions.length < 20 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm((f) => ({ ...f, inclusions: [...f.inclusions, ''] }))}><Icon name="plus" size={14} /> Add item</button>
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-gold-300/70 p-4">
          <legend className="px-2 text-sm font-medium text-olive-800">Applicable services (optional)</legend>
          {services.length === 0 ? <p className="text-sm text-ink/60">No services yet.</p> : (
            <ul className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
              {services.map((s) => (
                <li key={s._id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-cream-100">
                    <input type="checkbox" checked={form.applicableServices.includes(s._id)} onChange={() => toggleService(s._id)} className="accent-olive-700" /> {s.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-ink/55">The first selected service powers the “Book” button on the offer.</p>
        </fieldset>

        <FormSection title="Display & SEO">
          <Switch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active (visible on the website)" />
          <Switch checked={form.isFeatured} onChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} label="Featured" />
          <TextField label="Display order" type="number" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} />
          <span />
          <TextField label="SEO title" value={form.seoTitle} onChange={set('seoTitle')} error={errors.seoTitle} maxLength={70} />
          <TextField label="SEO description" value={form.seoDescription} onChange={set('seoDescription')} error={errors.seoDescription} maxLength={160} />
        </FormSection>
        {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>}
      </form>
    </Modal>
  );
}

export default function OffersPage() {
  const { query, setFilter, setPage } = useListQuery({ sort: 'displayOrder', type: '', isActive: '', search: '' });
  const { data, meta, loading, error, reload } = useApi((signal) => adminApi.offers.list(query, signal), [JSON.stringify(query)]);
  const { data: services } = useApi((signal) => adminApi.services.list({ limit: 100, sort: 'name' }, signal), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { run, busy } = useAction();
  const rows = data || [];
  const now = Date.now();

  const toggle = (o) => run(() => adminApi.offers.update(o._id, { isActive: !o.isActive }), { success: 'Saved' }).then((r) => r.ok && reload());
  const remove = async () => {
    const r = await run(() => adminApi.offers.remove(deleting._id), { success: 'Offer deleted' });
    if (r.ok) {
      setDeleting(null);
      reload();
    }
  };
  const state = (o) => {
    if (!o.isActive) return { key: 'inactive', text: 'Inactive' };
    if (o.validUntil && new Date(o.validUntil).getTime() < now) return { key: 'archived', text: 'Expired' };
    if (o.validFrom && new Date(o.validFrom).getTime() > now) return { key: 'pending', text: 'Scheduled' };
    return { key: 'active', text: 'Live' };
  };

  return (
    <>
      <AdminPageHeader title="Offers & bridal packages" subtitle="Shown on the Home and Pricing pages while active and within their dates." actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={14} /> Add offer</button>} />
      <FilterBar>
        <SearchBox value={query.search} onChange={(v) => setFilter('search', v)} placeholder="Search offers" className="w-full sm:w-60" />
        <select className="input w-auto" value={query.type} onChange={(e) => setFilter('type', e.target.value)} aria-label="Type">
          <option value="">All types</option>
          {OFFER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input w-auto" value={query.isActive} onChange={(e) => setFilter('isActive', e.target.value)} aria-label="Status">
          <option value="">Active & inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
        <select className="input w-auto" value={query.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          <option value="displayOrder">Display order</option>
          <option value="-createdAt">Newest</option>
          <option value="offerPrice">Price: low to high</option>
          <option value="-offerPrice">Price: high to low</option>
          <option value="validUntil">Ending soonest</option>
        </select>
      </FilterBar>

      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !rows.length && <Spinner className="h-7 w-7" />}
      {!loading && !error && !rows.length && <EmptyState title="No offers yet">Create an offer or bridal package to show it on the website.</EmptyState>}

      {rows.length > 0 && (
        <TableCard>
          <thead className="border-b border-gold-300/70 bg-cream-100">
            <tr><th className="th">Title</th><th className="th">Type</th><th className="th">Price</th><th className="th">Valid until</th><th className="th">State</th><th className="th">Active</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-gold-300/50">
            {rows.map((o) => {
              const st = state(o);
              return (
                <tr key={o._id} className="hover:bg-cream-100/70">
                  <td className="td"><p className="font-medium">{o.title}</p>{o.discountPercent > 0 && <p className="text-xs text-olive-700">{o.discountPercent}% off</p>}</td>
                  <td className="td">{label(o.type)}</td>
                  <td className="td whitespace-nowrap">{formatPrice(o.offerPrice)}{o.originalPrice > o.offerPrice && <span className="ml-1 text-xs text-ink/45 line-through">{formatPrice(o.originalPrice)}</span>}</td>
                  <td className="td whitespace-nowrap">{o.validUntil ? formatDate(o.validUntil) : '—'}</td>
                  <td className="td"><StatusBadge status={st.key}>{st.text}</StatusBadge></td>
                  <td className="td"><Switch checked={o.isActive} onChange={() => toggle(o)} disabled={busy} /></td>
                  <td className="td"><RowActions><IconButton icon="edit" label="Edit" onClick={() => setEditing(o)} /><IconButton icon="trash" label="Delete" danger onClick={() => setDeleting(o)} /></RowActions></td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      )}
      <Pagination meta={meta} onPage={setPage} className="mt-4" />

      {editing && (
        <OfferForm
          offer={editing === 'new' ? null : editing}
          services={services || []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} busy={busy} onClose={() => setDeleting(null)} onConfirm={remove} message={deleting ? `Delete “${deleting.title}”? This cannot be undone.` : ''} />
    </>
  );
}
