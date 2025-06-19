FROM node:alpine
WORKDIR /app
RUN mkdir -p backend

COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm install

WORKDIR /app
COPY backend ./backend
COPY utils ./utils
COPY network ./network

EXPOSE 3000
WORKDIR /app/backend
CMD ["npm", "run", "start"]
