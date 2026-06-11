import React, { useState } from 'react';
import { useAppState } from '../store/AppStateContext.jsx';

function ReturnModal({ recordId, onClose, showAlert }) {
  const { state, dispatch } = useAppState();
  const [returnStatus, setReturnStatus] = useState('normal');
  const [returnNote, setReturnNote] = useState('');
  const [damageNote, setDamageNote] = useState('');

  const record = state.borrowRecords.find(r => r.id === recordId);

  if (!record) return null;

  const isReturnNoteValid = returnNote.trim().length > 0;
  const isDamageNoteValid = returnStatus !== 'damaged' || damageNote.trim().length > 0;
  const isSubmitEnabled = isReturnNoteValid && isDamageNoteValid;

  const handleSubmit = () => {
    if (!isReturnNoteValid) {
      showAlert('danger', '请填写工具状态说明');
      return;
    }
    
    if (returnStatus === 'damaged' && !isDamageNoteValid) {
      showAlert('danger', '选择有损坏时必须填写损坏处理备注，不能用状态说明代替');
      return;
    }

    dispatch({
      type: 'RETURN_TOOL',
      payload: {
        recordId,
        returnNote: returnNote.trim(),
        damageReported: returnStatus === 'damaged',
        damageNote: returnStatus === 'damaged' ? damageNote.trim() : '',
      }
    });

    showAlert('success', '归还登记成功');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>归还工具</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
            <strong>{record.toolName}</strong>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              借出日期：{record.borrowDate} | 应还日期：{record.dueDate}
            </div>
          </div>

          <div className="form-group">
            <label>工具状态</label>
            <select value={returnStatus} onChange={e => setReturnStatus(e.target.value)}>
              <option value="normal">正常完好</option>
              <option value="damaged">有损坏</option>
            </select>
          </div>

          <div className="form-group">
            <label>状态说明 <span style={{ color: 'red' }}>*</span></label>
            <textarea
              value={returnNote}
              onChange={e => setReturnNote(e.target.value)}
              placeholder="请描述工具归还时的状态..."
              rows="3"
            />
          </div>

          {returnStatus === 'damaged' && (
            <>
              <div className="form-group">
                <label>损坏处理备注 <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  value={damageNote}
                  onChange={e => setDamageNote(e.target.value)}
                  placeholder="请描述损坏情况和处理建议..."
                  rows="3"
                />
              </div>
              <div className="photo-placeholder">
                📷 损坏照片占位（上传功能待开发）
              </div>
            </>
          )}

          <div className="alert alert-info">
            押金 ¥{record.depositAmount} 将在确认归还后退还
            {returnStatus === 'damaged' && '，损坏将扣除部分押金'}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!isSubmitEnabled}
          >
            确认归还
          </button>
          {!isSubmitEnabled && (
            <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '8px', width: '100%', textAlign: 'right' }}>
              {!isReturnNoteValid ? '请填写状态说明' : (returnStatus === 'damaged' && !isDamageNoteValid ? '请填写损坏处理备注' : '')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReturnModal;
