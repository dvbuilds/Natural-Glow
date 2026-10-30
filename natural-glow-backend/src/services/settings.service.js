import { SalonSettings } from '../models/SalonSettings.js';

const KEY = 'main';

// Singleton document, created lazily with the model defaults (unknown details stay empty).
async function getOrCreate() {
  return SalonSettings.findOneAndUpdate(
    { key: KEY },
    { $setOnInsert: { key: KEY } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function getSettings() {
  return (await getOrCreate()).toJSON();
}

export async function getPublicSettings() {
  const doc = (await getOrCreate()).toJSON();
  delete doc.key;
  return doc;
}

export async function updateSettings(input) {
  await getOrCreate();
  const doc = await SalonSettings.findOneAndUpdate(
    { key: KEY },
    { $set: input },
    { new: true, runValidators: true }
  );
  return doc.toJSON();
}
