# 多角色文章管理系统 - 后端 Dockerfile
# 支持 Docker / docker-compose 一键部署

FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json* ./
RUN npm install --production

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 暴露端口
EXPOSE 3000

# 启动时先执行数据库迁移，再启动服务
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
