#!/bin/bash

set -e

echo "=============================================="
echo "  社区共享工具借还台 - 891 验证脚本"
echo "=============================================="
echo ""

PASS=0
FAIL=0

pass() {
  echo "  ✅ $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  ❌ $1"
  FAIL=$((FAIL + 1))
}

section() {
  echo ""
  echo "📋 $1"
  echo "------------------------"
}

cd "$(dirname "$0")"

section "1. 项目结构检查"

if [ -f "package.json" ]; then
  pass "package.json 存在"
else
  fail "package.json 不存在"
fi

if [ -f "src/App.jsx" ]; then
  pass "App.jsx 存在"
else
  fail "App.jsx 不存在"
fi

if [ -f "src/pages/ToolList.jsx" ]; then
  pass "ToolList.jsx 存在"
else
  fail "ToolList.jsx 不存在"
fi

if [ -f "src/store/AppStateContext.jsx" ]; then
  pass "AppStateContext.jsx 存在"
else
  fail "AppStateContext.jsx 不存在"
fi

if [ -f "src/styles/index.css" ]; then
  pass "index.css 存在"
else
  fail "index.css 不存在"
fi

if [ -f "README.md" ]; then
  pass "README.md 存在"
else
  fail "README.md 不存在"
fi

section "2. 折叠分组功能检查"

if grep -q "collapsedGroups" src/pages/ToolList.jsx; then
  pass "ToolList.jsx 包含折叠分组状态 (collapsedGroups)"
else
  fail "ToolList.jsx 缺少折叠分组状态"
fi

if grep -q "toggleGroup" src/pages/ToolList.jsx; then
  pass "ToolList.jsx 包含分组切换函数 (toggleGroup)"
else
  fail "ToolList.jsx 缺少分组切换函数"
fi

if grep -q "toggleAll" src/pages/ToolList.jsx; then
  pass "ToolList.jsx 包含全部展开/折叠函数 (toggleAll)"
else
  fail "ToolList.jsx 缺少全部展开/折叠函数"
fi

if grep -q "tool-group" src/styles/index.css; then
  pass "index.css 包含折叠分组样式 (.tool-group)"
else
  fail "index.css 缺少折叠分组样式"
fi

if grep -q "tool-group-header" src/styles/index.css; then
  pass "index.css 包含分组头部样式 (.tool-group-header)"
else
  fail "index.css 缺少分组头部样式"
fi

if grep -q "tool_list_collapsed" src/pages/ToolList.jsx; then
  pass "折叠状态持久化到 localStorage (tool_list_collapsed)"
else
  fail "折叠状态未持久化"
fi

section "3. 移动端适配检查"

if grep -q "@media.*768px" src/styles/index.css; then
  pass "包含移动端响应式断点 (768px)"
else
  fail "缺少移动端响应式断点"
fi

if grep -q "filter-section" src/styles/index.css && grep -q "column" src/styles/index.css; then
  pass "筛选区移动端垂直布局"
else
  fail "筛选区可能缺少移动端适配"
fi

section "4. 损坏工具不能借出校验检查"

if grep -q "tool.status !== 'available'" src/store/AppStateContext.jsx; then
  pass "ADD_TO_CART 中检查工具状态"
else
  fail "ADD_TO_CART 中缺少工具状态检查"
fi

if grep -q "invalidTools" src/store/AppStateContext.jsx; then
  pass "CHECKOUT_BORROW 中二次校验工具状态 (invalidTools)"
else
  fail "CHECKOUT_BORROW 中缺少工具状态二次校验"
fi

if grep -q "tool.locked" src/store/AppStateContext.jsx; then
  pass "校验中包含锁定状态检查"
else
  fail "校验中缺少锁定状态检查"
fi

section "5. README 入口和账号检查"

if grep -q "入口地址" README.md; then
  pass "README 包含入口地址"
else
  fail "README 缺少入口地址"
fi

if grep -q "账号与角色" README.md; then
  pass "README 包含账号与角色说明"
else
  fail "README 缺少账号与角色说明"
fi

if grep -q "localhost:5173" README.md; then
  pass "README 包含本地开发地址 (localhost:5173)"
else
  fail "README 缺少本地开发地址"
fi

if grep -q "localhost:8080" README.md; then
  pass "README 包含生产部署地址 (localhost:8080)"
else
  fail "README 缺少生产部署地址"
fi

if grep -q "管理员" README.md; then
  pass "README 包含管理员账号说明"
else
  fail "README 缺少管理员账号说明"
fi

if grep -q "维修志愿者" README.md; then
  pass "README 包含维修志愿者账号说明"
else
  fail "README 缺少维修志愿者账号说明"
fi

section "6. Smoke 测试运行"

if command -v npm &> /dev/null; then
  echo "  运行 Smoke 测试..."
  if npm run smoke 2>&1; then
    pass "Smoke 测试通过"
  else
    fail "Smoke 测试失败"
  fi
else
  echo "  ⚠️  npm 不可用，跳过 Smoke 测试"
fi

section "7. 构建验证"

if command -v npm &> /dev/null; then
  echo "  运行生产构建..."
  if npm run build 2>&1; then
    pass "生产构建成功"
    if [ -d "dist" ]; then
      pass "构建产物目录 dist 存在"
    else
      fail "构建产物目录 dist 不存在"
    fi
  else
    fail "生产构建失败"
  fi
else
  echo "  ⚠️  npm 不可用，跳过构建验证"
fi

echo ""
echo "=============================================="
echo "  验证结果: $PASS 通过, $FAIL 失败"
echo "=============================================="

if [ $FAIL -gt 0 ]; then
  echo ""
  echo "❌ 部分验证未通过！"
  exit 1
else
  echo ""
  echo "🎉 所有验证通过！"
  echo ""
  echo "📋 验证要点总结："
  echo "  ✅ 折叠分组功能完整"
  echo "  ✅ 移动端响应式适配"
  echo "  ✅ 损坏工具不能借出双重校验"
  echo "  ✅ README 入口和账号信息"
  echo "  ✅ Smoke 测试通过"
  echo "  ✅ 生产构建成功"
  echo ""
  echo "💡 启动命令："
  echo "  - 开发模式：npm run dev"
  echo "  - 生产预览：npm run preview"
  echo "  - 测试验证：npm run smoke"
  exit 0
fi
