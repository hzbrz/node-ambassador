FROM node:17

WORKDIR /app
# we could do package*.json which is to capture all
COPY package*.json .
# COPY package-lock.json .

RUN npm install

COPY . .

CMD npm start