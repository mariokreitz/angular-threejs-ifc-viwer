ARG NODE_VERSION=24.11.0

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY . .
ARG BASE_HREF=/
ENV BASE_HREF=${BASE_HREF}
RUN npm run build -- --base-href=${BASE_HREF}
RUN if [ -d dist/multi-tenant-crm/browser ]; then \
      cp -r dist/multi-tenant-crm/browser dist/web; \
    else \
      cp -r dist/multi-tenant-crm dist/web; \
    fi

FROM nginx:stable-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /usr/src/app/dist/web /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]