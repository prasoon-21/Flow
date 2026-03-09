/**
 * Root tRPC Router — Aurika Flow
 */

import { router } from './trpc';
import { tenantRouter } from './routers/tenant.router';
import { pageRouter } from './routers/page.router';
import { dashboardRouter } from './routers/dashboard.router';
import { userRouter } from './routers/user.router';
import { tagRouter } from './routers/tag.router';
import { contactRouter } from './routers/contact.router';
import { notificationRouter } from './routers/notification.router';
import { inventoryRouter } from './routers/inventory.router';
import { orderRouter } from './routers/order.router';
import { purchaseRouter } from './routers/purchase.router';
import { ledgerRouter } from './routers/ledger.router';

// Disabled modules — kept in codebase but unwired
// import { channelRouter } from './routers/channel.router';
// import { emailRouter } from './routers/email.router';
// import { whatsappRouter } from './routers/whatsapp.router';
// import { shopifyRouter } from './routers/shopify.router';

export const appRouter = router({
  tenant: tenantRouter,
  page: pageRouter,
  dashboard: dashboardRouter,
  user: userRouter,
  tags: tagRouter,
  contact: contactRouter,
  notification: notificationRouter,
  inventory: inventoryRouter,
  order: orderRouter,
  purchase: purchaseRouter,
  ledger: ledgerRouter,
});

export type AppRouter = typeof appRouter;
