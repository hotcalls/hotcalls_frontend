FROM node:18.12.1-buster-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy all config files needed for build
COPY index.html ./
COPY vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY tailwind.config.ts postcss.config.js components.json ./
COPY .env* ./

# Copy source directories
COPY public/ public/
COPY src/ src/

# Build the app
RUN npm run build


FROM nginx:1.23.2-alpine

#Overwrite nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend build output to image
COPY --from=builder /app/dist /usr/share/nginx/html

# unknown
RUN touch /var/run/nginx.pid

# Change ownership
RUN chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

#Switch to new user
USER nginx

#Expose the port
EXPOSE 8080

#Configure commands
CMD ["nginx", "-g", "daemon off;"]