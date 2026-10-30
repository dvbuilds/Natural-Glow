import { ApiError } from '../utils/ApiError.js';

// validate({ params, query, body }) — each is a Zod schema.
// On success the parsed (typed, stripped, trimmed) value REPLACES the raw input,
// so controllers only ever see validated data.
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  for (const part of ['params', 'query', 'body']) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part] ?? {});
    if (result.success) {
      req[part] = result.data;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          field: [part, ...issue.path].join('.'),
          message: issue.message,
        });
      }
    }
  }
  if (errors.length) {
    return next(new ApiError(400, 'Validation failed', { code: 'VALIDATION_ERROR', errors }));
  }
  return next();
};
