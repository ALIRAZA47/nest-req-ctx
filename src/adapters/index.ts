export { RequestAdapter, AdapterType } from './adapter.interface';
export { ExpressAdapter, expressAdapter } from './express.adapter';
export { FastifyAdapter, fastifyAdapter } from './fastify.adapter';
export {
  detectAdapterType,
  getAdapter,
  createAdapter,
} from './adapter.factory';
