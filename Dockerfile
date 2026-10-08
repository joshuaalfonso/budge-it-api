FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --allow-build=esbuild

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]