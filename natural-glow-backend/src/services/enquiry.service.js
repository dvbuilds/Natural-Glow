import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate, toSort } from '../utils/pagination.js';
import { escapeRegex } from '../utils/text.js';

export async function createEnquiry(input) {
  const { website: _honeypot, ...data } = input;
  const doc = await ContactEnquiry.create(data);
  return { _id: doc._id };
}

export async function listEnquiries(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { subject: rx }];
  }
  return paginate(ContactEnquiry, filter, { page: q.page, limit: q.limit, sort: toSort(q.sort) });
}

export async function getEnquiry(id) {
  const doc = await ContactEnquiry.findById(id).select('-__v').lean();
  if (!doc) throw ApiError.notFound('Enquiry not found');
  return doc;
}

export async function updateEnquiryStatus(id, status) {
  const doc = await ContactEnquiry.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!doc) throw ApiError.notFound('Enquiry not found');
  return doc.toJSON();
}

export async function deleteEnquiry(id) {
  const doc = await ContactEnquiry.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound('Enquiry not found');
}
