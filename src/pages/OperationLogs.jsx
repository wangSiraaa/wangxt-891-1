import React, { useState } from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function OperationLogs() {
  const { state, dispatch } = useAppState();
  const [actionFilter, setActionFilter] = useState('all');

  const actionLabels = {
    borrow: '借用',
    return: '归还',
    return_damaged: '损坏归还',
    lock: '锁定',
    unlock: '解锁',
    start_maintenance: '开始维修',
    complete_maintenance: '完成维修',
  };

  const filteredLogs = state.operationLogs.filter(log => {
    if (actionFilter === 'all') return true;
    return log.action === actionFilter;
  });

  const handleReset = () => {
    if (window.confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      dispatch({ type: 'RESET_STATE' });
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>📝 操作日志</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={actionFilter} 
              onChange={e => setActionFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="all">全部操作</option>
              <option value="borrow">借用</option>
              <option value="return">归还</option>
              <option value="return_damaged">损坏归还</option>
              <option value="lock">锁定</option>
              <option value="unlock">解锁</option>
              <option value="start_maintenance">开始维修</option>
              <option value="complete_maintenance">完成维修</option>
            </select>
            <button 
              className="btn btn-danger btn-sm"
              onClick={handleReset}
            >
              重置数据
            </button>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无操作日志
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="log-item">
              <div className="log-item-time">
                {log.time}
              </div>
              <div className="log-item-content">
                <strong style={{ color: '#667eea' }}>[{actionLabels[log.action] || log.action}]</strong>{' '}
                <strong>{log.userName}</strong> {log.details}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>💾 数据存储说明</h2>
        </div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
          <p>• 所有数据保存在浏览器本地存储（localStorage）中</p>
          <p>• 刷新页面后数据仍然保留</p>
          <p>• 点击"重置数据"按钮可恢复初始种子数据</p>
          <p>• 借用记录、维修标记、排行榜数据均持久化存储</p>
        </div>
      </div>
    </div>
  );
}

export default OperationLogs;
