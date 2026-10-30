// Strips keys that enable NoSQL operator injection ($gt, $where, "a.b") or prototype pollution.
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

const clean = (value) => {
  if (Array.isArray(value)) {
    value.forEach(clean);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.') || FORBIDDEN.has(key)) {
        delete value[key];
      } else {
        clean(value[key]);
      }
    }
  }
};

export const sanitizeRequest = (req, _res, next) => {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};
