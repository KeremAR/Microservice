FROM node:18-alpine as builder

WORKDIR /app

# Uygulama bağımlılıklarını kopyala ve yükle
COPY package*.json ./
RUN npm ci

# Uygulama kaynak kodlarını kopyala ve derle
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Sadece gerekli dosyaları kopyala
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Port ayarı
EXPOSE 5004

# Production modunda başlat
CMD ["node", "dist/main.js"]