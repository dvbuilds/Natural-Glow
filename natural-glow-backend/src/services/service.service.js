import { Service } from '../models/Service.js';
import { createCrudService } from './crud.service.js';

export const serviceService = createCrudService(Service, {
  label: 'Service',
  publicConditions: () => [{ isActive: true }],
  filterMap: { category: 'category', featured: 'isFeatured', isActive: 'isActive' },
  searchFields: ['name', 'description'],
  slugFrom: 'name',
});
