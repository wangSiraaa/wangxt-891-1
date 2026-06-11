import React, { useState } from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function Maintenance({ showAlert }) {
  const { state, currentUser, dispatch } = useAppState();
  const [filter, setFilter] = useState('all');

  const filteredRecords = state.maintenanceRecords.filter(record => {
    if (filter === 'all') return true;
    return record.status === filter;
  });

  const statusLabel = {
    reported: '待维修',
    in_progress: '维修中',
    completed: '已完成',
  };

  const statusClass = {
    reported: 'damaged',
    in_progress: 'borrowed',
    completed: 'returned',
  };

  const handleStartMaintenance = (recordId) => {
    if (currentUser?.role !== 'maintainer' && currentUser?.role !== 'admin') {
      showAlert('warning', '只有维修志愿者或管理员可以开始维修');
      return;
    }
    dispatch({ 
      type: 'START_MAINTENANCE', 
      payload: { recordId, maintainerId: currentUser.id } 
    });
    showAlert('success', '已开始维修');
  };

  const handleCompleteMaintenance = (recordId) => {
    if (currentUser?.role !== 'maintainer' && currentUser?.role !== 'admin') {
      showAlert('warning', '只有维修志愿者或管理员可以完成维修');
      return;
    }
    dispatch({ type: 'COMPLETE_MAINTENANCE', payload: { recordId } });
    showAlert('success', '维修完成，工具已恢复可借用状态');
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>🔩 维修管理</h2>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="all">全部</option>
            <option value="reported">待维修</option>
            <option value="in_progress">维修中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无维修记录
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className="record-item">
              <div className="record-info">
                <div className="record-title">
                  {record.toolName}
                </div>
                <div className="record-meta">
                  <span>报修人：{record.reporterName}</span>
                  <span>报修日期：{record.reportDate}</span>
                  {record.completeDate && <span>完成日期：{record.completeDate}</span>}
                  {record.maintainerId && (
                    <span>维修人：{state.users.find(u => u.id === record.maintainerId)?.name || '-'}</span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                  问题描述：{record.description}
                </div>
                {record.photoPlaceholder && (
                  <div className="photo-placeholder" style={{ width: '120px', height: '80px', marginTop: '8px' }}>
                    📷 损坏照片
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`record-status ${statusClass[record.status]}`}>
                  {statusLabel[record.status]}
                </span>
                {record.status === 'reported' && 
                 (currentUser?.role === 'maintainer' || currentUser?.role === 'admin') && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStartMaintenance(record.id)}
                  >
                    开始维修
                  </button>
                )}
                {record.status === 'in_progress' && 
                 (currentUser?.role === 'maintainer' || currentUser?.role === 'admin') && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleCompleteMaintenance(record.id)}
                  >
                    维修完成
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>📊 维修统计</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '16px', background: '#f8d7da', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#721c24' }}>
              {state.maintenanceRecords.filter(r => r.status === 'reported').length}
            </div>
            <div style={{ fontSize: '13px', color: '#721c24' }}>待维修</div>
          </div>
          <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#856404' }}>
              {state.maintenanceRecords.filter(r => r.status === 'in_progress').length}
            </div>
            <div style={{ fontSize: '13px', color: '#856404' }}>维修中</div>
          </div>
          <div style={{ padding: '16px', background: '#d4edda', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#155724' }}>
              {state.maintenanceRecords.filter(r => r.status === 'completed').length}
            </div>
            <div style={{ fontSize: '13px', color: '#155724' }}>已完成</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Maintenance;
