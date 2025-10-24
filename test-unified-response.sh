#!/bin/bash

# 测试统一响应格式

echo "======================================"
echo "测试统一 API 响应格式"
echo "======================================"
echo ""

API_URL="http://localhost:3001/api"

echo "1. 测试成功响应 - 获取题目列表"
echo "--------------------------------------"
curl -s "${API_URL}/questions" | jq '.'
echo ""
echo ""

echo "2. 测试错误响应 - 验证失败"
echo "--------------------------------------"
curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "", "email": "invalid-email", "password": "123"}' | jq '.'
echo ""
echo ""

echo "3. 测试 404 错误"
echo "--------------------------------------"
curl -s "${API_URL}/questions/99999" | jq '.'
echo ""
echo ""

echo "4. 测试未授权访问"
echo "--------------------------------------"
curl -s "${API_URL}/auth/profile" | jq '.'
echo ""
echo ""

echo "======================================"
echo "测试完成"
echo "======================================"
echo ""
echo "期望的响应格式："
echo "成功: { code: 0, message: 'success', data: {...}, timestamp: ... }"
echo "失败: { code: 4xx/5xx, message: '...', data: null, errors: [...], timestamp: ... }"

