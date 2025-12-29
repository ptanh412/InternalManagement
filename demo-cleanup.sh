#!/bin/bash

# ============================================================
# Script demo - Chạy kiểm tra trên 1 service để test
# ============================================================

echo "🎯 Demo: Kiểm tra unused code trên website-service"
echo ""

cd website-service

echo "1️⃣ Kiểm tra unused variables với ESLint..."
npm run lint:unused 2>&1 | head -20

echo ""
echo "2️⃣ Kiểm tra unused dependencies..."
npm run check:deps 2>&1 | head -30

echo ""
echo "✅ Demo hoàn tất! Xem CLEANUP-README.md để biết thêm chi tiết."
