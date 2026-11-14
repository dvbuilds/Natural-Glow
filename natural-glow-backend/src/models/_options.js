// Shared schema options: timestamps + a toJSON transform that hides internals.
const transform = (_doc, ret) => {
  delete ret.__v;
  delete ret.password;
  delete ret.dedupeKey;
  delete ret.trackingToken; // private link between a customer's browser and their request
  return ret;
};

export const baseOptions = {
  timestamps: true,
  toJSON: { transform },
  toObject: { transform },
};
