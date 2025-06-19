FROM node:18
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend .

WORKDIR /app
COPY utils ./utils

EXPOSE 5173
WORKDIR /app/frontend
CMD ["npm", "run", "dev", "--", "--host"]
