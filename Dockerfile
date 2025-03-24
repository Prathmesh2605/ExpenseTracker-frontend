# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY ./expense-tracker-client/package*.json ./
RUN npm ci
COPY ./expense-tracker-client/ ./
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/expense-tracker-client /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
