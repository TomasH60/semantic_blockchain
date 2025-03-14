FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npx tsc

CMD ["sh", "-c", "npx squid-typeorm-migration apply && node -r dotenv/config lib/main.js"]
