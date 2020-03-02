FROM node:lts-slim

RUN apt-get update \
 && apt-get install \
        --no-install-recommends \
        --fix-missing \
        --assume-yes \
            dnsutils vim iputils-ping \
        && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN git clone https://github.com/steilerDev/google-sheet-timetracker.git /ffnbr-tracker/

WORKDIR /ffnbr-tracker/client

RUN npm install

CMD [ "npm", "start" ]