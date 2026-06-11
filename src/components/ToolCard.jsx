import React from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function ToolCard({ tool, onClick }) {
  const { canBorrowTool, currentUser, state } = useAppState();
  
  const isAvailable = tool.status === 'available' && !tool.locked;
  const canBorrow = currentUser?.role === 'resident' && canBorrowTool(tool.id, currentUser.id);
  
  const statusLabel = {
    available: '可借用',
    borrowed: '已借出',
    damaged: '已损坏',
    maintenance: '维修中',
    locked: '已锁定',
  }[tool.status] || tool.status;

  const cardClass = `tool-card ${!isAvailable ? 'disabled' : ''}`;

  return (
    <div 
      className={cardClass}
      onClick={() => onClick && onClick(tool.id)}
    >
      <div className="tool-card-image">{tool.image}</div>
      <div className="tool-card-body">
        <div className="tool-card-title">{tool.name}</div>
        <div className="tool-card-meta">
          <span className={`tool-status ${tool.locked ? 'locked' : tool.status}`}>
            {tool.locked ? '已锁定' : statusLabel}
          </span>
          <span className="tool-card-deposit">押金 ¥{tool.deposit}</span>
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          累计借用 {tool.totalBorrows} 次
        </div>
      </div>
    </div>
  );
}

export default ToolCard;
