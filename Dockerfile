# Dockerfile for CodeCrowds
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# copy package files and install (including dev deps so sequelize-cli is available)
COPY package*.json ./

RUN npm ci --silent

# copy app source
COPY . .

# Fix CRLF if files were edited on Windows and make the entrypoint executable
RUN if [ -f ./docker-entrypoint.sh ]; then sed -i 's/\r$//' ./docker-entrypoint.sh || true && chmod +x ./docker-entrypoint.sh; fi

# Expose app port
EXPOSE 10000

# Switch to non-root node user (node image provides a 'node' user)
USER node

# Entrypoint will handle migrations then start the app
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
