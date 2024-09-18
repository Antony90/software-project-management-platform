#Setup environment
FROM node:latest
WORKDIR /frontend/
ENV PATH /app/node_modules/.bin:$PATH

#Copy the common modules
ADD ./common /common

#Copy the package defs
COPY ./frontend/package.json /frontend/
COPY ./frontend/package-lock.json /frontend/

#Install react dependancies
RUN npm install

# Copy application files
ADD ./frontend /frontend/

EXPOSE 3000

RUN npm run build

RUN npm install -g serve

#Start app
CMD ["serve", "-s", "build"]