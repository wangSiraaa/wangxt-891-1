import { seedData, getInitialState, saveState, resetState } from '../src/data/seedData.js';

console.log('🌱 社区共享工具借还台 - 种子数据验证');
console.log('=' .repeat(50));

console.log('\n📊 数据统计：');
console.log(`  - 用户数: ${seedData.users.length}`);
console.log(`  - 工具分类数: ${seedData.categories.length}`);
console.log(`  - 工具总数: ${seedData.tools.length}`);
console.log(`  - 借用记录数: ${seedData.borrowRecords.length}`);
console.log(`  - 维修记录数: ${seedData.maintenanceRecords.length}`);
console.log(`  - 操作日志数: ${seedData.operationLogs.length}`);

console.log('\n👥 用户列表：');
seedData.users.forEach(u => {
  const roleName = { admin: '管理员', maintainer: '维修志愿者', resident: '居民' }[u.role];
  console.log(`  ${u.avatar} ${u.name} (${roleName})`);
});

console.log('\n🔧 工具状态统计：');
const statusCount = {};
seedData.tools.forEach(t => {
  const status = t.locked ? 'locked' : t.status;
  statusCount[status] = (statusCount[status] || 0) + 1;
});
Object.entries(statusCount).forEach(([status, count]) => {
  const label = { available: '可借用', borrowed: '已借出', damaged: '已损坏', maintenance: '维修中', locked: '已锁定' }[status];
  console.log(`  ${label}: ${count} 件`);
});

console.log('\n✅ 种子数据验证完成！');
console.log('\n💡 提示：运行 npm run dev 启动开发服务器');
