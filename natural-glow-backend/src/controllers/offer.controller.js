import { offerService } from '../services/offer.service.js';
import { createCrudController } from './crud.controller.js';

export const offerController = createCrudController(offerService, 'Offer');
