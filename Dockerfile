FROM node:8.16.0-alpine  
WORKDIR /usr/src/app/

RUN npm install firebase --save