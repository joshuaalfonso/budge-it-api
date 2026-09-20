import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { authRoute } from './auth/auth.route.js';
import type { HonoVariables } from './types/hono.js';

const app = new Hono<{
    Variables: HonoVariables;
}>();

app.use(
    "*",
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.get('/', (c) => {
  return c.text('Hello Hono!')
}) 
 

app.route('/auth', authRoute);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
