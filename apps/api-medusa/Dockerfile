FROM node:14
WORKDIR /app
COPY ./dist/apps/home/api-medusa/package.json ./
COPY ./dist/apps/home/api-medusa/yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive
COPY ./dist/apps/home/api-medusa/ ./
ENV PORT=80
EXPOSE ${PORT}
CMD yarn start:prod
