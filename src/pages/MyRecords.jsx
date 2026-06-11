import React, { useState } from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function MyRecords({ onReturn, showAlert }) {
  const { state, currentUser, isOverdue, getResidentBorrowRecords } = useAppState();
  const [filter, setFilter] = useState('all');

  const records = currentUser?.role === 'resident'
    ? getResidentBorrowRecords(currentUser.id)
    : state.borrowRecords;

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    if (filter === 'borrowed') return record.status === 'borrowed';
    if (filter === 'returned') return record.status === 'returned';
    if (filter === 'overdue') return record.status === 'borrowed' && isOverdue(record.dueDate);
    if (filter === 'damaged') return record.status === 'damaged';
    return true;
  });

  const statusLabel = (record) => {
    if (record.status === 'borrowed' && isOverdue(record.dueDate)) return '已逾期';
    return {
      borrowed: '借用中',
      returned: '已归还',
      damaged: '损坏待修',
      maintenance: '维修中',
    }[record.status] || record.status;
  };

  const statusClass = (record) => {
    if (record.status === 'borrowed' && isOverdue(record.dueDate)) return 'overdue';
    return record.status;
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>📋 借用记录</h2>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="all">全部</option>
            <option value="borrowed">借用中</option>
            <option value="overdue">已逾期</option>
            <option value="returned">已归还</option>
            <option value="damaged">损坏待修</option>
          </select>
        </div>

        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无借用记录
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className="record-item">
              <div className="record-info">
                <div className="record-title">
                  {record.toolName}
                  {record.status === 'borrowed' && isOverdue(record.dueDate) && (
                    <span className="overdue-badge">逾期</span>
                  )}
                </div>
                <div className="record-meta">
                  <span>借出日期：{record.borrowDate}</span>
                  <span>应还日期：{record.dueDate}</span>
                  {record.returnDate && <span>归还日期：{record.returnDate}</span>}
                  <span>押金：¥{record.depositAmount}</span>
                </div>
                {record.returnNote && (
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                    归还备注：{record.returnNote}
                  </div>
                )}
                {record.damageNote && (
                  <div style={{ fontSize: '13px', color: '#e74c3c', marginTop: '4px' }}>
                    损坏说明：{record.damageNote}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`record-status ${statusClass(record)}`}>
                  {statusLabel(record)}
                </span>
                {record.status === 'borrowed' && currentUser?.role === 'resident' && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => onReturn(record.id)}
                  >
                    归还
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyRecords;
