FROM node:18-alpine

WORKDIR /app

# Install root-level dependencies (sequelize tooling, etc.)
COPY package*.json ./
RUN npm install

# Install app dependencies
WORKDIR /app/profolio-bookstore
COPY profolio-bookstore/package*.json ./
RUN npm install

# Copy the rest of the source
WORKDIR /app
COPY . .

WORKDIR /app/profolio-bookstore
EXPOSE 3000

CMD ["npm", "start"]
