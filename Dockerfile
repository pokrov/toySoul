FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV DATABASE_URL=mysql://soultoy:soultoy_local@db:3306/soultoy
RUN BETTER_AUTH_SECRET=build-only-placeholder-never-use-at-runtime npm run build
EXPOSE 3000
CMD ["npm", "start"]
