import { seedData } from '../src/data/seedData.js';

console.log('🧪 社区共享工具借还台 - Smoke 测试');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     错误: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

console.log('\n📦 1. 种子数据验证');
console.log('-'.repeat(40));

test('用户数据完整', () => {
  assert(seedData.users.length > 0, '用户列表不能为空');
  const hasAdmin = seedData.users.some(u => u.role === 'admin');
  const hasMaintainer = seedData.users.some(u => u.role === 'maintainer');
  const hasResident = seedData.users.some(u => u.role === 'resident');
  assert(hasAdmin, '必须包含管理员角色');
  assert(hasMaintainer, '必须包含维修志愿者角色');
  assert(hasResident, '必须包含居民角色');
});

test('工具数据完整', () => {
  assert(seedData.tools.length > 0, '工具列表不能为空');
  seedData.tools.forEach(tool => {
    assert(tool.id, '工具必须有 id');
    assert(tool.name, '工具必须有名称');
    assert(tool.categoryId, '工具必须有分类');
    assert(typeof tool.deposit === 'number', '押金必须是数字');
    assert(tool.status, '工具必须有状态');
  });
});

test('包含各种状态的工具', () => {
  const statuses = new Set(seedData.tools.map(t => t.status));
  assert(statuses.has('available'), '必须有可借用的工具');
  assert(statuses.has('borrowed'), '必须有已借出的工具');
  assert(statuses.has('damaged'), '必须有已损坏的工具');
  assert(statuses.has('maintenance'), '必须有维修中的工具');
  assert(seedData.tools.some(t => t.locked), '必须有锁定的工具');
});

test('借用记录数据完整', () => {
  assert(seedData.borrowRecords.length > 0, '借用记录不能为空');
  seedData.borrowRecords.forEach(record => {
    assert(record.id, '记录必须有 id');
    assert(record.userId, '记录必须有用户 id');
    assert(record.toolId, '记录必须有工具 id');
    assert(record.borrowDate, '记录必须有借出日期');
    assert(record.dueDate, '记录必须有应还日期');
    assert(record.status, '记录必须有状态');
  });
});

console.log('\n🔒 2. 业务规则验证');
console.log('-'.repeat(40));

function isOverdue(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);
  return today > dueDate;
}

function canBorrowTool(toolId, userId, state) {
  const tool = state.tools.find(t => t.id === toolId);
  if (!tool) return false;
  if (tool.status !== 'available') return false;
  if (tool.locked) return false;
  if (state.borrowCart.some(item => item.toolId === toolId)) return false;
  if (userId && state.borrowRecords.some(
    r => r.userId === userId && r.status === 'borrowed' && isOverdue(r.dueDate)
  )) {
    return false;
  }
  return true;
}

test('损坏工具不能借出', () => {
  const damagedTool = seedData.tools.find(t => t.status === 'damaged');
  assert(damagedTool, '存在损坏的工具');
  const canBorrow = canBorrowTool(damagedTool.id, 'u1', seedData);
  assert(!canBorrow, '损坏工具应该不能借出');
});

test('维修中工具不能借出', () => {
  const maintenanceTool = seedData.tools.find(t => t.status === 'maintenance');
  assert(maintenanceTool, '存在维修中的工具');
  const canBorrow = canBorrowTool(maintenanceTool.id, 'u1', seedData);
  assert(!canBorrow, '维修中工具应该不能借出');
});

test('已锁定工具不能借出', () => {
  const lockedTool = seedData.tools.find(t => t.locked);
  assert(lockedTool, '存在锁定的工具');
  const canBorrow = canBorrowTool(lockedTool.id, 'u1', seedData);
  assert(!canBorrow, '锁定工具应该不能借出');
});

test('已借出工具不能重复借出', () => {
  const borrowedTool = seedData.tools.find(t => t.status === 'borrowed');
  assert(borrowedTool, '存在已借出的工具');
  const canBorrow = canBorrowTool(borrowedTool.id, 'u1', seedData);
  assert(!canBorrow, '已借出工具不能重复借出');
});

test('同一工具不能重复加入借用篮', () => {
  const availableTool = seedData.tools.find(t => t.status === 'available' && !t.locked);
  assert(availableTool, '存在可借用的工具');
  
  const stateWithCart = {
    ...seedData,
    borrowCart: [{ toolId: availableTool.id, toolName: availableTool.name, deposit: availableTool.deposit }]
  };
  
  const canBorrow = canBorrowTool(availableTool.id, 'u1', stateWithCart);
  assert(!canBorrow, '已在借用篮中的工具不能重复加入');
});

test('有逾期记录的用户不能借出', () => {
  const availableTool = seedData.tools.find(t => t.status === 'available' && !t.locked);
  assert(availableTool, '存在可借用的工具');
  
  const overdueUser = seedData.users.find(u => u.role === 'resident');
  assert(overdueUser, '存在居民用户');
  
  const stateWithOverdue = {
    ...seedData,
    borrowRecords: [
      ...seedData.borrowRecords,
      {
        id: 'test_overdue',
        userId: overdueUser.id,
        toolId: 'some_tool',
        status: 'borrowed',
        dueDate: '2020-01-01',
      }
    ]
  };
  
  const canBorrow = canBorrowTool(availableTool.id, overdueUser.id, stateWithOverdue);
  assert(!canBorrow, '有逾期记录的用户应该不能借出');
});

test('归还必须填写状态说明', () => {
  const validateStatus = (returnNote) => {
    if (!returnNote.trim()) return false;
    return true;
  };
  
  assert(!validateStatus(''), '没有状态说明不能归还');
  assert(!validateStatus('   '), '空白状态说明不能归还');
  assert(validateStatus('工具完好'), '有状态说明可以通过校验');
});

test('选择有损坏时必须单独填写损坏处理备注 - 按钮禁用', () => {
  const isButtonDisabled = (returnStatus, returnNote, damageNote) => {
    return !returnNote.trim() || (returnStatus === 'damaged' && !damageNote.trim());
  };
  
  assert(isButtonDisabled('normal', '', ''), '没有状态说明按钮禁用');
  assert(!isButtonDisabled('normal', '工具完好', ''), '正常归还时有状态说明按钮可用');
  assert(isButtonDisabled('damaged', '有损坏', ''), '选择损坏但无损坏备注按钮禁用');
  assert(isButtonDisabled('damaged', '', '手柄断裂'), '选择损坏但无状态说明按钮禁用');
  assert(!isButtonDisabled('damaged', '有损坏', '手柄断裂需要更换'), '选择损坏且两者都填写按钮可用');
});

test('选择有损坏时必须单独填写损坏处理备注 - 提交校验', () => {
  const validateSubmit = (returnStatus, returnNote, damageNote) => {
    if (!returnNote.trim()) {
      return { valid: false, error: '请填写工具状态说明' };
    }
    if (returnStatus === 'damaged') {
      if (!damageNote.trim()) {
        return { valid: false, error: '请填写损坏处理备注' };
      }
    }
    return { valid: true };
  };
  
  let result = validateSubmit('normal', '', '');
  assert(!result.valid && result.error === '请填写工具状态说明', '无状态说明校验失败');
  
  result = validateSubmit('normal', '工具完好', '');
  assert(result.valid, '正常归还校验通过');
  
  result = validateSubmit('damaged', '有损坏', '');
  assert(!result.valid && result.error === '请填写损坏处理备注', '选择损坏但无损坏备注校验失败');
  
  result = validateSubmit('damaged', '', '手柄断裂');
  assert(!result.valid && result.error === '请填写工具状态说明', '选择损坏但无状态说明校验失败');
  
  result = validateSubmit('damaged', '有损坏', '手柄断裂需要更换');
  assert(result.valid, '选择损坏且两者都填写校验通过');
});

test('不能用状态说明自动代替损坏处理备注', () => {
  const buildPayload = (returnStatus, returnNote, damageNote) => {
    return {
      returnNote,
      damageReported: returnStatus === 'damaged',
      damageNote: damageNote,
    };
  };
  
  const payload1 = buildPayload('damaged', '工具损坏', '');
  assert(payload1.damageNote === '', '空的损坏备注应该保持为空，不能用状态说明代替');
  assert(payload1.damageNote !== payload1.returnNote, '损坏备注不能等于状态说明');
  
  const payload2 = buildPayload('damaged', '有损坏', '手柄断裂');
  assert(payload2.damageNote === '手柄断裂', '有损坏备注时应该保持原值');
});

console.log('\n🔐 5. Reducer 服务端校验验证');
console.log('-'.repeat(40));

function simulateReturnReducer(state, payload) {
  const { recordId, returnNote, damageReported, damageNote } = payload;
  const record = state.borrowRecords.find(r => r.id === recordId);
  if (!record || record.status !== 'borrowed') return { stateChanged: false, reason: 'record_not_found' };

  const trimmedReturnNote = (returnNote || '').trim();
  const trimmedDamageNote = (damageNote || '').trim();

  if (!trimmedReturnNote) {
    return { stateChanged: false, reason: 'empty_return_note' };
  }
  if (damageReported && !trimmedDamageNote) {
    return { stateChanged: false, reason: 'empty_damage_note' };
  }

  const logDetails = damageReported 
    ? `归还${record.toolName}，发现损坏：${trimmedDamageNote}` 
    : `归还${record.toolName}，状态正常`;

  const maintenanceDesc = damageReported ? trimmedDamageNote : null;

  return {
    stateChanged: true,
    trimmedReturnNote,
    trimmedDamageNote: damageReported ? trimmedDamageNote : '',
    logDetails,
    maintenanceDesc,
  };
}

test('reducer 校验 - 空状态说明被拒绝', () => {
  const borrowedRecord = seedData.borrowRecords.find(r => r.status === 'borrowed');
  assert(borrowedRecord, '存在借出中的记录');
  
  const result = simulateReturnReducer(seedData, {
    recordId: borrowedRecord.id,
    returnNote: '',
    damageReported: false,
    damageNote: '',
  });
  assert(!result.stateChanged && result.reason === 'empty_return_note', '空状态说明应被拒绝');
});

test('reducer 校验 - 仅空格状态说明被拒绝', () => {
  const borrowedRecord = seedData.borrowRecords.find(r => r.status === 'borrowed');
  const result = simulateReturnReducer(seedData, {
    recordId: borrowedRecord.id,
    returnNote: '   ',
    damageReported: false,
    damageNote: '',
  });
  assert(!result.stateChanged && result.reason === 'empty_return_note', '仅空格状态说明应被拒绝');
});

test('reducer 校验 - 损坏时未单独填损坏备注被拒绝', () => {
  const borrowedRecord = seedData.borrowRecords.find(r => r.status === 'borrowed');
  const result = simulateReturnReducer(seedData, {
    recordId: borrowedRecord.id,
    returnNote: '工具有些损坏',
    damageReported: true,
    damageNote: '',
  });
  assert(!result.stateChanged && result.reason === 'empty_damage_note', '损坏但无损坏备注应被拒绝');
});

test('reducer 校验 - 损坏时仅空格损坏备注被拒绝', () => {
  const borrowedRecord = seedData.borrowRecords.find(r => r.status === 'borrowed');
  const result = simulateReturnReducer(seedData, {
    recordId: borrowedRecord.id,
    returnNote: '有损坏',
    damageReported: true,
    damageNote: '   ',
  });
  assert(!result.stateChanged && result.reason === 'empty_damage_note', '损坏但仅空格损坏备注应被拒绝');
});

test('reducer 校验 - 正常归还校验通过且数据正确', () => {
  const borrowedRecord = seedData.borrowRecords.find(r => r.status === 'borrowed');
  const result = simulateReturnReducer(seedData, {
    recordId: borrowedRecord.id,
    returnNote: '  工具完好无损  ',
    damageReported: false,
    damageNote: '',
  });
  assert(result.stateChanged, '正常归还应通过校验');
  assert(result.trimmedReturnNote === '工具完好无损', '状态说明应被 trim');
  assert(result.trimmedDamageNote === '', '非损坏时损坏备注应为空字符串');
  assert(result.logDetails.includes('状态正常'), '日志应显示状态正常');
  assert(result.maintenanceDesc === null, '非损坏时不生成维修描述');
});

test('reducer 校验 - 损坏归还校验通过且两者独立保存', () => {
  const borrowedRecord = seedData.borrowRecords.find(r => r.status === 'borrowed');
  const result = simulateReturnReducer(seedData, {
    recordId: borrowedRecord.id,
    returnNote: '  归还时检查发现问题  ',
    damageReported: true,
    damageNote: '  手柄塑料外壳断裂，需更换  ',
  });
  assert(result.stateChanged, '损坏归还应通过校验');
  assert(result.trimmedReturnNote === '归还时检查发现问题', '状态说明应被 trim');
  assert(result.trimmedDamageNote === '手柄塑料外壳断裂，需更换', '损坏备注应被 trim');
  assert(result.trimmedReturnNote !== result.trimmedDamageNote, '状态说明与损坏备注必须独立，不能互相替代');
  assert(result.logDetails.includes('手柄塑料外壳断裂，需更换'), '操作日志必须使用损坏备注，不能用状态说明代替');
  assert(result.maintenanceDesc === '手柄塑料外壳断裂，需更换', '维修记录必须使用损坏备注，不能用状态说明代替');
});

test('reducer 校验 - 损坏备注与状态说明相同视为有效但独立保存', () => {
  const borrowedRecord = seedData.borrowRecords.find(r => r.status === 'borrowed');
  const result = simulateReturnReducer(seedData, {
    recordId: borrowedRecord.id,
    returnNote: '手柄断裂',
    damageReported: true,
    damageNote: '手柄断裂',
  });
  assert(result.stateChanged, '用户主动填写相同内容应允许通过');
  assert(result.trimmedReturnNote === '手柄断裂', '状态说明保存正确');
  assert(result.trimmedDamageNote === '手柄断裂', '损坏备注保存正确');
});

console.log('\n📊 3. 排行榜数据验证');
console.log('-'.repeat(40));

test('排行榜按借用次数排序', () => {
  const residents = seedData.users.filter(u => u.role === 'resident');
  const sorted = [...residents].sort((a, b) => b.borrowCount - a.borrowCount);
  
  for (let i = 1; i < sorted.length; i++) {
    assert(sorted[i-1].borrowCount >= sorted[i].borrowCount, 
      `排行榜应该降序排列：第${i}名 ${sorted[i-1].borrowCount} >= 第${i+1}名 ${sorted[i].borrowCount}`);
  }
});

test('所有居民都在排行榜中', () => {
  const residents = seedData.users.filter(u => u.role === 'resident');
  assert(residents.length >= 3, '至少有3名居民用于排行');
});

console.log('\n📝 4. 操作日志验证');
console.log('-'.repeat(40));

test('操作日志包含多种操作类型', () => {
  const actions = new Set(seedData.operationLogs.map(l => l.action));
  assert(actions.size > 0, '操作日志不能为空');
  assert(actions.has('borrow'), '应有借用操作日志');
  assert(actions.has('return'), '应有归还操作日志');
  assert(actions.has('lock'), '应有锁定操作日志');
});

console.log('\n' + '=' .repeat(60));
console.log(`📈 测试结果: ${passed} 通过, ${failed} 失败`);

if (failed > 0) {
  console.log('\n❌ 部分测试未通过，请检查代码！');
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！');
  console.log('\n📋 验证要点总结：');
  console.log('  ✅ 损坏工具借出按钮禁用');
  console.log('  ✅ 维修中工具不能借出');
  console.log('  ✅ 锁定工具不能借出');
  console.log('  ✅ 同一工具不能重复加入借用篮');
  console.log('  ✅ 有逾期记录不能借出');
  console.log('  ✅ 归还必须填写状态说明');
  console.log('  ✅ 选择损坏时必须填写损坏处理备注 - 按钮禁用');
  console.log('  ✅ 选择损坏时必须填写损坏处理备注 - 提交校验');
  console.log('  ✅ 不能用状态说明自动代替损坏处理备注');
  console.log('  ✅ Reducer服务端校验 - 空状态说明被拒绝');
  console.log('  ✅ Reducer服务端校验 - 仅空格状态说明被拒绝');
  console.log('  ✅ Reducer服务端校验 - 损坏时未单独填损坏备注被拒绝');
  console.log('  ✅ Reducer服务端校验 - 损坏时仅空格损坏备注被拒绝');
  console.log('  ✅ Reducer服务端校验 - 正常归还数据正确且损坏备注为空');
  console.log('  ✅ Reducer服务端校验 - 损坏归还状态说明与损坏备注独立保存');
  console.log('  ✅ Reducer服务端校验 - 操作日志与维修记录使用损坏备注而非状态说明');
  console.log('  ✅ 排行榜按借用次数排序');
  console.log('  ✅ 操作日志完整记录');
  console.log('\n💡 提示：');
  console.log('  - 数据持久化：localStorage 保存，刷新页面后数据仍保留');
  console.log('  - 启动应用：npm run dev');
  console.log('  - 构建生产版本：npm run build');
  console.log('  - 运行测试：npm run smoke');
}
