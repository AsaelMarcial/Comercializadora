FROM node:14

WORKDIR /app

COPY package*.json ./
RUN npm install cors
RUN npm install react-query
RUN npm install
RUN npm install react-bootstrap bootstrap

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
