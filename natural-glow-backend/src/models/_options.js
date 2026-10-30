// Shared schema options: timestamps + a toJSON transform that hides internals.
const transform = (_doc, ret) => {
  delete ret.__v;
  delete ret.password;
  delete ret.dedupeKey;
  return ret;
};

export const baseOptions = {
  timestamps: true,
  toJSON: { transform },
  toObject: { transform },
};
