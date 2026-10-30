import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export async function startTestDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('natural-glow-test'));
  // Build indexes (e.g. the unique dedupeKey index) before tests run.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function stopTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

export async function clearDb() {
  for (const c of Object.values(mongoose.connection.collections)) {
    // eslint-disable-next-line no-await-in-loop
    await c.deleteMany({});
  }
}
