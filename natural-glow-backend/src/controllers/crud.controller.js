import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// Thin HTTP adapters over a crud service (see services/crud.service.js).
export function createCrudController(service, label) {
  return {
    listPublic: asyncHandler(async (req, res) => {
      const { items, meta } = await service.list(req.query, { isPublic: true });
      sendSuccess(res, items, { meta });
    }),
    getPublic: asyncHandler(async (req, res) => {
      sendSuccess(res, await service.getById(req.params.id, { isPublic: true }));
    }),
    listAdmin: asyncHandler(async (req, res) => {
      const { items, meta } = await service.list(req.query);
      sendSuccess(res, items, { meta });
    }),
    getOne: asyncHandler(async (req, res) => {
      sendSuccess(res, await service.getById(req.params.id));
    }),
    create: asyncHandler(async (req, res) => {
      sendSuccess(res, await service.create(req.body), { status: 201, message: `${label} created` });
    }),
    update: asyncHandler(async (req, res) => {
      sendSuccess(res, await service.update(req.params.id, req.body), { message: `${label} updated` });
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      sendSuccess(res, null, { message: `${label} deleted` });
    }),
  };
}
