export const medicationRoutes = {
  list: 'GET /api/v1/medications',
  progress: 'GET /api/v1/medications/progress',
  create: 'POST /api/v1/medications',
  confirmDose: 'POST /api/v1/medications/:id/confirm',
  update: 'PATCH /api/v1/medications/:id',
} as const;
