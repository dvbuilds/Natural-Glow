import { ApiError } from '../utils/ApiError.js';
import { paginate, toSort } from '../utils/pagination.js';
import { escapeRegex, uniqueSlug } from '../utils/text.js';

/**
 * Generic list/get/create/update/delete logic shared by Services, Testimonials and Offers.
 *
 * cfg:
 *  label            human name used in error messages
 *  publicConditions () => array of Mongo conditions that define "published" content
 *  filterMap        { queryKey: documentField } exact-match filters
 *  searchFields     fields searched (case-insensitive, escaped) by ?search=
 *  slugFrom         field used to generate a unique slug (optional)
 *  mapInput         (data) => data, e.g. rename API fields to schema fields
 */
export function createCrudService(Model, cfg) {
  const {
    label,
    publicConditions = () => [{ isPublished: true }],
    filterMap = {},
    searchFields = [],
    slugFrom,
    mapInput = (d) => d,
  } = cfg;

  const buildFilter = (q, isPublic) => {
    const and = [];
    if (isPublic) and.push(...publicConditions());
    for (const [queryKey, field] of Object.entries(filterMap)) {
      if (q[queryKey] !== undefined) and.push({ [field]: q[queryKey] });
    }
    if (q.search && searchFields.length) {
      const rx = new RegExp(escapeRegex(q.search), 'i');
      and.push({ $or: searchFields.map((f) => ({ [f]: rx })) });
    }
    return and.length ? { $and: and } : {};
  };

  return {
    async list(q, { isPublic = false } = {}) {
      return paginate(Model, buildFilter(q, isPublic), {
        page: q.page,
        limit: q.limit,
        sort: toSort(q.sort),
      });
    },

    async getById(id, { isPublic = false } = {}) {
      const filter = { _id: id };
      if (isPublic) filter.$and = publicConditions();
      const doc = await Model.findOne(filter).select('-__v').lean();
      if (!doc) throw ApiError.notFound(`${label} not found`);
      return doc;
    },

    async create(input) {
      const data = mapInput({ ...input });
      if (slugFrom) data.slug = await uniqueSlug(Model, data[slugFrom]);
      const doc = await Model.create(data);
      return doc.toJSON();
    },

    async update(id, input) {
      const doc = await Model.findById(id);
      if (!doc) throw ApiError.notFound(`${label} not found`);
      const data = mapInput({ ...input });
      if (slugFrom && data[slugFrom] && data[slugFrom] !== doc[slugFrom]) {
        data.slug = await uniqueSlug(Model, data[slugFrom], doc._id);
      }
      doc.set(data); // set + save so validators and pre-validate hooks run
      await doc.save();
      return doc.toJSON();
    },

    async remove(id) {
      const doc = await Model.findByIdAndDelete(id);
      if (!doc) throw ApiError.notFound(`${label} not found`);
    },
  };
}
