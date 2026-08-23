#!/bin/sh
set -e

# 对持久化卷中的 SQLite 数据库应用迁移
npx prisma migrate deploy

exec npm run start
