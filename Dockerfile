FROM mhart/alpine-node:10 as builder

WORKDIR /build
COPY . . 
RUN unset NPM_CONFIG_USER && npm config set unsafe-perm true
RUN npm install && npm install --only=dev
RUN npm run build-docker

FROM mhart/alpine-node:10

RUN unset NPM_CONFIG_USER && npm config set unsafe-perm true

ENV LOCAL_URL="http://localhost:3300" \
    LOCAL_PATH="/usr/src/app/temp" \
    ADAPTOR_PATH="../adaptors/" \
    MANIFEST_URL="http://relm.realeyes.com/video/" \
    NODE_ENV="production"

WORKDIR /usr/src/app

RUN mkdir -p /usr/src/app/temp

COPY --from=builder /build/dist /usr/src/app/dist

COPY package.json package-lock.json ./
COPY ecosystem.json .

RUN npm install --only=production && npm install -g pm2

EXPOSE 3300
CMD ["pm2-runtime", "ecosystem.json"]