export const medicationRoutes = {
  list: 'GET /api/v1/medications',
  create: 'POST /api/v1/medications',
  petToday: 'GET /api/v1/medications/pets/:petId/today',
  update: 'PATCH /api/v1/medications/:id',
  confirm: 'POST /api/v1/medications/:id/confirm',
} as const;
