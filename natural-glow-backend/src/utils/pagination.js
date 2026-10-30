// Turns "-price" into { price: -1, _id: 1 } (the _id tie-breaker keeps pages stable).
export const toSort = (sortParam) => {
  const desc = sortParam.startsWith('-');
  const field = desc ? sortParam.slice(1) : sortParam;
  return { [field]: desc ? -1 : 1, _id: 1 };
};

export async function paginate(Model, filter, { page, limit, sort, select = '-__v', populate }) {
  let query = Model.find(filter)
    .select(select)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([query.lean(), Model.countDocuments(filter)]);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  };
}
