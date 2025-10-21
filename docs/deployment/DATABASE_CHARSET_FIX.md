# 数据库字符集修复指南

## 问题描述

如果你在数据库中看到中文字符显示为乱码（如 `???` 或其他奇怪字符），这通常是由于数据库字符集配置不正确导致的。

## 解决方案

我们提供了两种解决方案：

### 方案一：完全重置数据库（推荐）

⚠️ **警告**: 此操作会删除所有现有数据！

```bash
# 执行重置脚本
./reset-database.sh
```

这个脚本会：
1. 停止所有容器
2. 删除 MySQL 数据卷
3. 重新启动 MySQL（使用正确的字符集配置）
4. 执行字符集修复脚本
5. 验证配置
6. 启动所有服务

### 方案二：修复现有数据库

如果你想保留现有数据（虽然可能是乱码），可以手动执行修复：

```bash
# 1. 进入 MySQL 容器
docker compose exec mysql mysql -uroot -proot123456 interview_system

# 2. 在 MySQL 中执行以下命令
SET NAMES utf8mb4;
ALTER DATABASE interview_system CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

# 3. 修复所有表
ALTER TABLE roles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE questions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE templates CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interview_sessions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE submissions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE score_records CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE interview_reports CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

或者使用提供的 SQL 脚本：

```bash
docker compose exec -T mysql mysql -uroot -proot123456 interview_system < fix-database-charset.sql
```

## 验证修复

执行检查脚本验证字符集配置：

```bash
./check-database-charset.sh
```

你应该看到：
- `character_set_server`: utf8mb4
- `collation_server`: utf8mb4_unicode_ci
- 所有表的 `TABLE_COLLATION`: utf8mb4_unicode_ci

## 预防措施

为了避免将来出现字符集问题，我们已经做了以下配置：

### 1. MySQL 配置文件 (my.cnf)

```ini
[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
init_connect = 'SET NAMES utf8mb4'
```

### 2. Docker Compose 配置

```yaml
mysql:
  command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
  environment:
    TZ: Asia/Shanghai
  volumes:
    - ./backend/my.cnf:/etc/mysql/conf.d/my.cnf
```

### 3. TypeORM 配置

```typescript
{
  charset: 'utf8mb4',
  timezone: '+08:00',
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
}
```

### 4. SQL 初始化脚本

```sql
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
ALTER DATABASE interview_system CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE ... CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 常见问题

### Q: 为什么使用 utf8mb4 而不是 utf8？

A: MySQL 的 `utf8` 只支持最多 3 字节的 UTF-8 字符，不能存储某些 emoji 和特殊字符。`utf8mb4` 支持完整的 4 字节 UTF-8 编码。

### Q: 修复后数据还是乱码？

A: 如果数据在存入时就已经是乱码，修复字符集无法恢复。需要：
1. 使用 `reset-database.sh` 重建数据库
2. 重新导入正确的数据

### Q: 如何测试中文是否正常？

```bash
# 进入 MySQL
docker compose exec mysql mysql -uroot -proot123456 interview_system

# 插入测试数据
INSERT INTO roles (name, description) VALUES ('测试角色', '这是一个测试描述');

# 查询测试
SELECT * FROM roles WHERE name = '测试角色';
```

如果显示正常，说明字符集配置正确。

### Q: 如何在应用中正确处理中文？

1. 确保前端使用 UTF-8 编码
2. API 请求设置正确的 Content-Type: `application/json; charset=utf-8`
3. 数据库连接使用 utf8mb4 字符集
4. 代码文件保存为 UTF-8 编码

## 技术细节

### 字符集层级

MySQL 字符集配置有多个层级（从高到低）：

1. **服务器级别**: `character_set_server`
2. **数据库级别**: `ALTER DATABASE ... CHARACTER SET`
3. **表级别**: `CREATE TABLE ... CHARACTER SET`
4. **列级别**: `column_name VARCHAR(100) CHARACTER SET`
5. **连接级别**: `SET NAMES utf8mb4`

我们的配置确保所有层级都使用 utf8mb4。

### 排序规则 (Collation)

- `utf8mb4_unicode_ci`: 基于 Unicode 标准，支持多语言排序（推荐）
- `utf8mb4_general_ci`: 速度更快，但排序准确性略低
- `utf8mb4_bin`: 二进制排序，区分大小写

我们使用 `utf8mb4_unicode_ci` 以获得最佳的多语言支持。

## 相关文件

- `docker-compose.yml` - MySQL 容器配置
- `backend/my.cnf` - MySQL 配置文件
- `backend/init.sql` - 数据库初始化脚本
- `backend/src/app.module.ts` - TypeORM 配置
- `fix-database-charset.sql` - 字符集修复脚本
- `reset-database.sh` - 数据库重置脚本
- `check-database-charset.sh` - 字符集检查脚本

## 支持

如果遇到其他问题，请：
1. 查看 MySQL 日志: `docker compose logs mysql`
2. 运行检查脚本: `./check-database-charset.sh`
3. 提交 Issue 并附上错误信息

