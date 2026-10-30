import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { SelectField, Switch, TextArea, TextField } from '../../components/ui/Form.jsx';
import { EmptyState, ErrorState, Pagination, Spinner, StatusBadge } from '../../components/ui/Feedback.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery } from '../../hooks/useListQuery.js';
import { PRICE_TYPES, SERVICE_CATEGORIES, SERVICE_SORTS, label } from '../../lib/constants.js';
import { formatPrice } from '../../lib/format.js';
import { hasErrors, isHttpsUrl, mapApiErrors } from '../../lib/validate.js';
import { AdminPageHeader, FilterBar, FormSection, IconButton, RowActions, SearchBox, TableCard } from '../components/AdminUI.jsx';
import { useAction } from '../hooks/useAction.js';

const EMPTY = {
  name: '', category: 'hair', description: '', price: '', priceType: 'fixed', durationMinutes: '', imageUrl: '',
  isActive: true, isFeatured: false, displayOrder: 0, seoTitle: '', seoDescription: '',
};

const toForm = (s) => ({
  ...EMPTY,
  ...s,
  price: s.price ?? '',
  durationMinutes: s.durationMinutes ?? '',
  description: s.description || '',
  imageUrl: s.imageUrl || '',
  seoTitle: s.seoTitle || '',
  seoDescription: s.seoDescription || '',
});

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
  if (f.price === '' || Number.isNaN(Number(f.price)) || Number(f.price) < 0) e.price = 'Enter a price of 0 or more.';
  if (f.durationMinutes !== '' && !(Number.isInteger(Number(f.durationMinutes)) && Number(f.durationMinutes) >= 5 && Number(f.durationMinutes) <= 720)) e.durationMinutes = 'Whole minutes between 5 and 720.';
  if (f.imageUrl.trim() && !isHttpsUrl(f.imageUrl.trim())) e.imageUrl = 'Must be a full https:// URL.';
  if (!Number.isInteger(Number(f.displayOrder))) e.displayOrder = 'Whole number.';
  if (f.description.length > 1000) e.description = 'At most 1000 characters.';
  return e;
}

const toPayload = (f) => ({
  name: f.name.trim(),
  category: f.category,
  description: f.description.trim(),
  price: Number(f.price),
  priceType: f.priceType,
  ...(f.durationMinutes !== '' ? { durationMinutes: Number(f.durationMinutes) } : {}), // cannot be cleared via the API once set
  imageUrl: f.imageUrl.trim(),
  isActive: f.isActive,
  isFeatured: f.isFeatured,
  displayOrder: Number(f.displayOrder) || 0,
  seoTitle: f.seoTitle.trim(),
  seoDescription: f.seoDescription.trim(),
});

function ServiceForm({ service, onClose, onSaved }) {
  const [form, setForm] = useState(service ? toForm(service) : EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const { run, busy } = useAction();
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const er = validate(form);
    setErrors(er);
    if (hasErrors(er)) return;
    setFormError('');
    const payload = toPayload(form);
    const res = await run(() => (service ? adminApi.services.update(service._id, payload) : adminApi.services.create(payload)), {
      success: service ? 'Service updated' : 'Service created',
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
      title={service ? 'Edit service' : 'Add service'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" form="service-form" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save service'}</button>
        </>
      }
    >
      <form id="service-form" onSubmit={submit} noValidate className="space-y-5">
        <FormSection title="Basics">
          <TextField label="Name" required className="sm:col-span-2" value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
          <SelectField label="Category" required value={form.category} onChange={set('category')} error={errors.category}>
            {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </SelectField>
          <TextField label="Duration (minutes)" type="number" min="5" max="720" value={form.durationMinutes} onChange={set('durationMinutes')} error={errors.durationMinutes} />
          <TextField label="Price (₹)" required type="number" min="0" step="1" value={form.price} onChange={set('price')} error={errors.price} />
          <SelectField label="Price type" value={form.priceType} onChange={set('priceType')} error={errors.priceType}>
            {PRICE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </SelectField>
          <TextArea label="Description" className="sm:col-span-2" rows={3} value={form.description} onChange={set('description')} error={errors.description} maxLength={1000} />
          <TextField label="Image URL" className="sm:col-span-2" placeholder="https://…" value={form.imageUrl} onChange={set('imageUrl')} error={errors.imageUrl} hint="Optional. Paste the link to the service photo (e.g. from Cloudinary). A placeholder shows until set." />
        </FormSection>

        <FormSection title="Display">
          <Switch checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active (visible on the website)" />
          <Switch checked={form.isFeatured} onChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} label="Featured (shown first on Home)" />
          <TextField label="Display order" type="number" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} hint="Lower numbers appear first." />
        </FormSection>

        <FormSection title="SEO (optional)">
          <TextField label="SEO title" className="sm:col-span-2" value={form.seoTitle} onChange={set('seoTitle')} error={errors.seoTitle} maxLength={70} hint={`${form.seoTitle.length}/70`} />
          <TextArea label="SEO description" className="sm:col-span-2" rows={2} value={form.seoDescription} onChange={set('seoDescription')} error={errors.seoDescription} maxLength={160} hint={`${form.seoDescription.length}/160`} />
        </FormSection>
        {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>}
      </form>
    </Modal>
  );
}

export default function ServicesPage() {
  const { query, setFilter, setPage } = useListQuery({ sort: 'displayOrder', category: '', isActive: '', search: '' });
  const { data, meta, loading, error, reload } = useApi((signal) => adminApi.services.list(query, signal), [JSON.stringify(query)]);
  const [editing, setEditing] = useState(null); // null | 'new' | service
  const [deleting, setDeleting] = useState(null);
  const { run, busy } = useAction();
  const rows = data || [];

  const toggle = (s, field) => run(() => adminApi.services.update(s._id, { [field]: !s[field] }), { success: 'Saved' }).then((r) => r.ok && reload());
  const remove = async () => {
    const r = await run(() => adminApi.services.remove(deleting._id), { success: 'Service deleted' });
    if (r.ok) {
      setDeleting(null);
      reload();
    }
  };

  return (
    <>
      <AdminPageHeader title="Services" subtitle="Your service menu and prices. The website reads these live." actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={14} /> Add service</button>} />
      <FilterBar>
        <SearchBox value={query.search} onChange={(v) => setFilter('search', v)} placeholder="Search services" className="w-full sm:w-60" />
        <select className="input w-auto" value={query.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
        </select>
        <select className="input w-auto" value={query.isActive} onChange={(e) => setFilter('isActive', e.target.value)} aria-label="Status">
          <option value="">Active & inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
        <select className="input w-auto" value={query.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          {SERVICE_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </FilterBar>

      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !rows.length && <Spinner className="h-7 w-7" />}
      {!loading && !error && !rows.length && <EmptyState title="No services yet">Add your first service to show it on the website.</EmptyState>}

      {rows.length > 0 && (
        <TableCard>
          <thead className="border-b border-gold-300/70 bg-cream-100">
            <tr><th className="th">Service</th><th className="th">Category</th><th className="th">Price</th><th className="th">Duration</th><th className="th">Active</th><th className="th">Featured</th><th className="th">Order</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-gold-300/50">
            {rows.map((s) => (
              <tr key={s._id} className="hover:bg-cream-100/70">
                <td className="td"><p className="font-medium">{s.name}</p><p className="text-xs text-ink/50">/{s.slug}</p></td>
                <td className="td">{label(s.category)}</td>
                <td className="td whitespace-nowrap">{formatPrice(s.price, s.priceType)}</td>
                <td className="td">{s.durationMinutes ? `${s.durationMinutes} min` : '—'}</td>
                <td className="td"><Switch checked={s.isActive} onChange={() => toggle(s, 'isActive')} disabled={busy} /></td>
                <td className="td"><Switch checked={s.isFeatured} onChange={() => toggle(s, 'isFeatured')} disabled={busy} /></td>
                <td className="td">{s.displayOrder}</td>
                <td className="td"><RowActions><IconButton icon="edit" label="Edit" onClick={() => setEditing(s)} /><IconButton icon="trash" label="Delete" danger onClick={() => setDeleting(s)} /></RowActions></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
      <Pagination meta={meta} onPage={setPage} className="mt-4" />

      {editing && (
        <ServiceForm
          service={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        message={deleting ? `Delete “${deleting.name}”? Existing appointments keep their saved name and price. To hide it temporarily, switch it to inactive instead.` : ''}
      />
    </>
  );
}
