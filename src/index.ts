import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { authRoute } from './auth/auth.route.js';
import type { HonoVariables } from './types/hono.js';
import { dashboardRoute } from './routes/dashboard/dashboard.route.js';
import { walletRoute } from './routes/wallet/wallet.route.js';
import categoryRoutes from './routes/category/category.route.js';
import transactionRoutes from './routes/transaction/transaction.route.js';

const app = new Hono<{
    Variables: HonoVariables;
}>();


app.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  })
);

app.get('/', (c) => {
  return c.text('Hello Hono!')
}) 

app.route('/auth', authRoute);
app.route('/dashboard', dashboardRoute);
app.route('/wallet', walletRoute);
app.route('/category', categoryRoutes);
app.route('/transaction', transactionRoutes);


// Global 404 Handler (Unmatched routes)
app.notFound((c) => {
  return c.json({ success: false, error: "Route not found" }, 404);
});

// Global Error Handler (Runtime / Database exceptions)
app.onError((err, c) => {
  console.error(`[Server Error]: ${err.stack}`);

  // Catch MySQL / Drizzle Foreign Key constraint errors
  if (err.message.includes("foreign key constraint fails")) {
    return c.json({ success: false, error: "Invalid userId or referenced entity does not exist" }, 400);
  }

  // Catch MySQL Duplicate Entry errors
  if (err.message.includes("ER_DUP_ENTRY")) {
    return c.json({ success: false, error: "Record already exists" }, 409);
  }

  // Default Fallback
  return c.json(
    {
      success: false,
      error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    },
    500
  );

});

serve({
  fetch: app.fetch,
  port: 3000,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
