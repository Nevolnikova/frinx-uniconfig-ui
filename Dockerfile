
FROM node:8.9-alpine

ARG ODL
ARG WF_SERVER
ARG REACT_APP_LOGIN_ENABLED

# Create a work directory and copy dependency files.
COPY ["package.json", "package-lock.json*", "/tmp/"]
RUN cd /tmp && npm install --silent


RUN mkdir /app && cp -r /tmp/node_modules /app

WORKDIR /app
COPY . /app

RUN sed -i 's,.*ODL_HOST=.*,ODL_HOST='"http://""${ODL}"',' ./.env
RUN sed -i 's,.*WF_SERVER=.*,WF_SERVER='"http://""${WF_SERVER}/api/"',' ./.env
RUN sed -i 's,.*REACT_APP_LOGIN_ENABLED=.*,REACT_APP_LOGIN_ENABLED='\""${REACT_APP_LOGIN_ENABLED}\""',' ./.env

EXPOSE 3000

CMD ["npm","run","dev"]
