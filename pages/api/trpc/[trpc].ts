/**
 * tRPC API Handler (Next.js Pages Router)
 */

import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '@/server/api/root';
import { createContext } from '@/server/api/trpc';

export default createNextApiHandler({
  router: appRouter,
  createContext: async (opts) => {
    return createContext({ req: opts.req });
  },
  onError: ({ error, path }) => {
    console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
  },
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '80mb',
    },
  },
};
