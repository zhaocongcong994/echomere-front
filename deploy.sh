#!/bin/bash
set -e

# 本脚本在 macOS 本地运行，把代码同步到服务器并重新部署。
# 用法：./deploy.sh

SERVER="root@81.70.23.109"
PASSWORD="${SERVER_PASSWORD:-12345Qwert!@}"
REMOTE_DIR="/opt/metasight-clone"

echo "==> 同步代码到服务器..."
# 使用 rsync + sshpass 或 expect 自动输入密码；本机无 sshpass 时可用 expect 包装
if command -v sshpass >/dev/null 2>&1; then
  sshpass -p "$PASSWORD" rsync -avz --exclude=node_modules --exclude=.next --exclude=backend/node_modules --exclude=backend/dist --exclude=.git "$PWD/" "$SERVER:$REMOTE_DIR/"
else
  echo "请安装 sshpass 或手动同步代码"
  exit 1
fi

echo "==> 在服务器上构建并启动..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "cd $REMOTE_DIR && docker compose down && docker compose build --no-cache && docker compose up -d"

echo "==> 检查服务状态..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER" "docker compose ps && docker compose logs --tail=20 backend frontend"

echo "==> 部署完成，访问 http://81.70.23.109:8080"
