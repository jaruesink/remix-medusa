import Medusa from '@medusajs/medusa-js';

export const createMedusaClient = () => {
  const BACKEND_URL =
    process.env['PUBLIC_MEDUSA_URL'] || 'http://localhost:9000';
  return new Medusa({ baseUrl: BACKEND_URL, maxRetries: 2 });
};
