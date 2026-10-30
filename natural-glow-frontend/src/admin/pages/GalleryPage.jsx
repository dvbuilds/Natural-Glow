import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { MAX_UPLOAD_MB } from '../../config/env.js';
import { Field, SelectField, Switch, TextField } from '../../components/ui/Form.jsx';
import { EmptyState, ErrorState, Pagination, Spinner, StatusBadge } from '../../components/ui/Feedback.jsx';
import Icon from '../../components/ui/Icon.jsx';
import ImageSlot from '../../components/ui/ImageSlot.jsx';
import Modal, { ConfirmDialog } from '../../components/ui/Modal.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useListQuery } from '../../hooks/useListQuery.js';
import { GALLERY_CATEGORIES, label } from '../../lib/constants.js';
import { optimizeImage } from '../../lib/format.js';
import { hasErrors, mapApiErrors } from '../../lib/validate.js';
import { AdminPageHeader, FilterBar, FormSection } from '../components/AdminUI.jsx';
import { useAction } from '../hooks/useAction.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// One form for both "upload" (file required, multipart) and "edit" (metadata only, JSON PATCH).
function GalleryForm({ item, services, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState({
    title: item?.title || '',
    caption: item?.caption || '',
    category: item?.category || 'salon',
    serviceId: item?.service ? String(item.service) : '',
    isPublished: item?.isPublished ?? true,
    displayOrder: item?.displayOrder ?? 0,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const { run, busy } = useAction();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setErrors((er) => ({ ...er, image: 'Only JPEG, PNG or WebP images are allowed.' }));
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setErrors((er) => ({ ...er, image: `Image must be ${MAX_UPLOAD_MB} MB or smaller.` }));
      return;
    }
    setErrors((er) => ({ ...er, image: undefined }));
    setFile(f);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const er = {};
    if (!isEdit && !file) er.image = 'Choose an image to upload.';
    if (form.title.length > 100) er.title = 'At most 100 characters.';
    if (form.caption.length > 300) er.caption = 'At most 300 characters.';
    if (!Number.isInteger(Number(form.displayOrder))) er.displayOrder = 'Whole number.';
    setErrors(er);
    if (hasErrors(er)) return;
    setFormError('');

    const onError = (e) => {
      if (e.code === 'VALIDATION_ERROR') setErrors(mapApiErrors(e));
      setFormError(e.message); // e.g. STORAGE_NOT_CONFIGURED (503), FILE_TOO_LARGE (413), INVALID_FILE_CONTENT
    };

    let call;
    if (isEdit) {
      call = () =>
        adminApi.gallery.update(item._id, {
          title: form.title.trim(),
          caption: form.caption.trim(),
          category: form.category,
          ...(form.serviceId ? { serviceId: form.serviceId } : {}),
          isPublished: form.isPublished,
          displayOrder: Number(form.displayOrder) || 0,
        });
    } else {
      const fd = new FormData();
      fd.append('image', file);
      if (form.title.trim()) fd.append('title', form.title.trim());
      if (form.caption.trim()) fd.append('caption', form.caption.trim());
      fd.append('category', form.category);
      if (form.serviceId) fd.append('serviceId', form.serviceId);
      fd.append('isPublished', String(form.isPublished));
      fd.append('displayOrder', String(Number(form.displayOrder) || 0));
      call = () => adminApi.gallery.upload(fd);
    }
    const res = await run(call, { success: isEdit ? 'Image updated' : 'Image uploaded', onError });
    if (res.ok) onSaved();
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title={isEdit ? 'Edit image details' : 'Upload image'}
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="gallery-form" className="btn btn-primary btn-sm" disabled={busy}>{busy ? (isEdit ? 'Saving…' : 'Uploading…') : isEdit ? 'Save' : 'Upload'}</button>
        </>
      }
    >
      <form id="gallery-form" onSubmit={submit} noValidate className="space-y-5">
        {isEdit ? (
          <ImageSlot src={optimizeImage(item.image.url, 'f_auto,q_auto,w_600')} alt={item.title} label="Image" className="aspect-video rounded-xl" />
        ) : (
          <Field label="Image" required error={errors.image} hint={`JPEG, PNG or WebP, up to ${MAX_UPLOAD_MB} MB.`}>
            <input ref={inputRef} type="file" accept={ALLOWED.join(',')} className="hidden" onChange={pickFile} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Selected preview" className="aspect-video w-full rounded-xl object-cover" />
                <button type="button" className="btn btn-outline btn-sm absolute right-2 top-2" onClick={() => inputRef.current?.click()}>Change</button>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()} className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-olive-600/40 bg-cream-100 text-olive-800 hover:bg-cream-200">
                <Icon name="upload" size={26} /> <span className="text-sm">Choose an image</span>
              </button>
            )}
          </Field>
        )}

        <FormSection title="Details">
          <TextField label="Title (optional)" className="sm:col-span-2" value={form.title} onChange={set('title')} error={errors.title} maxLength={100} hint="Also used as the image’s alt text." />
          <TextField label="Caption (optional)" className="sm:col-span-2" value={form.caption} onChange={set('caption')} error={errors.caption} maxLength={300} />
          <SelectField label="Category" value={form.category} onChange={set('category')} error={errors.category}>
            {GALLERY_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </SelectField>
          <SelectField label="Related service (optional)" value={form.serviceId} onChange={set('serviceId')} error={errors.serviceId}>
            <option value="">None</option>
            {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </SelectField>
          <TextField label="Display order" type="number" value={form.displayOrder} onChange={set('displayOrder')} error={errors.displayOrder} />
          <div className="flex items-end pb-2"><Switch checked={form.isPublished} onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} label="Published" /></div>
        </FormSection>
        {formError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">{formError}</p>}
      </form>
    </Modal>
  );
}

export default function GalleryPage() {
  const { query, setFilter, setPage } = useListQuery({ limit: 12, sort: 'displayOrder', category: '', isPublished: '' });
  const { data, meta, loading, error, reload } = useApi((signal) => adminApi.gallery.list(query, signal), [JSON.stringify(query)]);
  const { data: services } = useApi((signal) => adminApi.services.list({ limit: 100, sort: 'name' }, signal), []);
  const [editing, setEditing] = useState(null); // 'new' | item
  const [deleting, setDeleting] = useState(null);
  const { run, busy } = useAction();
  const items = data || [];

  const togglePublish = (it) => run(() => adminApi.gallery.update(it._id, { isPublished: !it.isPublished }), { success: it.isPublished ? 'Unpublished' : 'Published' }).then((r) => r.ok && reload());
  const remove = async () => {
    const r = await run(() => adminApi.gallery.remove(deleting._id), { success: 'Image deleted' });
    if (r.ok) {
      setDeleting(null);
      reload();
    }
  };

  return (
    <>
      <AdminPageHeader title="Gallery" subtitle="Images are stored on Cloudinary and shown on the Gallery page." actions={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="upload" size={14} /> Upload image</button>} />
      <FilterBar>
        <select className="input w-auto" value={query.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {GALLERY_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
        </select>
        <select className="input w-auto" value={query.isPublished} onChange={(e) => setFilter('isPublished', e.target.value)} aria-label="Visibility">
          <option value="">Published & hidden</option>
          <option value="true">Published only</option>
          <option value="false">Hidden only</option>
        </select>
        <select className="input w-auto" value={query.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort">
          <option value="displayOrder">Display order</option>
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
        </select>
      </FilterBar>

      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !items.length && <Spinner className="h-7 w-7" />}
      {!loading && !error && !items.length && <EmptyState title="No images yet">Upload your first photo to fill the website gallery.</EmptyState>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => (
          <figure key={it._id} className="card overflow-hidden">
            <div className="relative">
              <ImageSlot src={optimizeImage(it.image.url, 'f_auto,q_auto,w_500,c_fill,ar_1:1')} alt={it.title || 'Gallery image'} label="Image" className="aspect-square" />
              {!it.isPublished && <span className="absolute left-2 top-2"><StatusBadge status="draft">Hidden</StatusBadge></span>}
            </div>
            <figcaption className="p-3">
              <p className="truncate text-sm font-medium">{it.title || 'Untitled'}</p>
              <p className="text-xs text-ink/55">{label(it.category)} · #{it.displayOrder}</p>
              <div className="mt-2 flex items-center justify-between">
                <button className="text-xs text-olive-700 hover:underline" onClick={() => togglePublish(it)} disabled={busy}>{it.isPublished ? 'Unpublish' : 'Publish'}</button>
                <div className="flex">
                  <button aria-label="Edit" title="Edit" className="rounded-full p-1.5 text-olive-800 hover:bg-olive-700/10" onClick={() => setEditing(it)}><Icon name="edit" size={15} /></button>
                  <button aria-label="Delete" title="Delete" className="rounded-full p-1.5 text-red-700 hover:bg-red-100" onClick={() => setDeleting(it)}><Icon name="trash" size={15} /></button>
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} className="mt-6" />

      {editing && (
        <GalleryForm
          item={editing === 'new' ? null : editing}
          services={services || []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <ConfirmDialog open={Boolean(deleting)} busy={busy} onClose={() => setDeleting(null)} onConfirm={remove} message="Delete this image? It is removed from Cloudinary and the website. This cannot be undone." />
    </>
  );
}
