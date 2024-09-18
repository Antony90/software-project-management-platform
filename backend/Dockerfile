#Setup environment
FROM node:latest
WORKDIR /backend/
ENV PATH /app/node_modules/.bin:$PATH

#Copy the common modules
ADD ./common /common

#Copy the package defs
COPY ./backend/package.json /backend/
COPY ./backend/package-lock.json /backend/

#Install react dependancies
RUN npm install

# Copy application files
ADD ./backend /backend/

# Write the env file
RUN echo "PORT=8000" > /backend/.env


EXPOSE 8000

RUN npm run build

#Start app
CMD ["npm", "start"]