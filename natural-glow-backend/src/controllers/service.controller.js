import { serviceService } from '../services/service.service.js';
import { createCrudController } from './crud.controller.js';

export const serviceController = createCrudController(serviceService, 'Service');
