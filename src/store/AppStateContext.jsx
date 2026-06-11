import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getInitialState, saveState } from '../data/seedData.js';

const AppStateContext = createContext(null);

const STORAGE_KEY = 'community_tool_sharing_state';

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_USER': {
      return { ...state, currentUserId: action.payload };
    }

    case 'ADD_TO_CART': {
      const { toolId } = action.payload;
      const tool = state.tools.find(t => t.id === toolId);
      if (!tool) return state;
      
      if (state.borrowCart.find(item => item.toolId === toolId)) {
        return state;
      }
      
      if (tool.status !== 'available' || tool.locked) {
        return state;
      }
      
      const newCart = [
        ...state.borrowCart,
        {
          toolId: tool.id,
          toolName: tool.name,
          deposit: tool.deposit,
          addedAt: new Date().toISOString(),
        }
      ];
      
      return { ...state, borrowCart: newCart };
    }

    case 'REMOVE_FROM_CART': {
      const { toolId } = action.payload;
      const newCart = state.borrowCart.filter(item => item.toolId !== toolId);
      return { ...state, borrowCart: newCart };
    }

    case 'CLEAR_CART': {
      return { ...state, borrowCart: [] };
    }

    case 'CHECKOUT_BORROW': {
      const { userId, dueDays = 7 } = action.payload;
      const user = state.users.find(u => u.id === userId);
      if (!user || state.borrowCart.length === 0) return state;
      
      const hasOverdue = state.borrowRecords.some(
        r => r.userId === userId && r.status === 'borrowed' && isOverdue(r.dueDate)
      );
      if (hasOverdue) return state;
      
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + dueDays);
      
      const formatDate = (d) => d.toISOString().split('T')[0];
      
      const newRecords = state.borrowCart.map((item, index) => ({
        id: `br_${Date.now()}_${index}`,
        userId: userId,
        userName: user.name,
        toolId: item.toolId,
        toolName: item.toolName,
        borrowDate: formatDate(today),
        dueDate: formatDate(dueDate),
        returnDate: null,
        status: 'borrowed',
        depositAmount: item.deposit,
        returnNote: '',
        damageReported: false,
        damageNote: '',
      }));
      
      const updatedTools = state.tools.map(tool => {
        if (state.borrowCart.some(item => item.toolId === tool.id)) {
          return { ...tool, status: 'borrowed', totalBorrows: tool.totalBorrows + 1 };
        }
        return tool;
      });
      
      const updatedUsers = state.users.map(u => {
        if (u.id === userId) {
          return { ...u, borrowCount: u.borrowCount + state.borrowCart.length };
        }
        return u;
      });
      
      const newLogs = state.borrowCart.map(item => ({
        id: `log_${Date.now()}_${Math.random()}`,
        userId: userId,
        userName: user.name,
        action: 'borrow',
        targetType: 'tool',
        targetId: item.toolId,
        targetName: item.toolName,
        details: `借用${item.toolName}，押金${item.deposit}元`,
        time: new Date().toLocaleString('zh-CN'),
      }));
      
      return {
        ...state,
        borrowRecords: [...newRecords, ...state.borrowRecords],
        tools: updatedTools,
        users: updatedUsers,
        borrowCart: [],
        operationLogs: [...newLogs, ...state.operationLogs],
      };
    }

    case 'RETURN_TOOL': {
      const { recordId, returnNote, damageReported, damageNote } = action.payload;
      const record = state.borrowRecords.find(r => r.id === recordId);
      if (!record || record.status !== 'borrowed') return state;

      const trimmedReturnNote = (returnNote || '').trim();
      const trimmedDamageNote = (damageNote || '').trim();

      if (!trimmedReturnNote) {
        console.warn('归还校验失败：状态说明不能为空');
        return state;
      }
      if (damageReported && !trimmedDamageNote) {
        console.warn('归还校验失败：损坏工具必须单独填写损坏处理备注，不能用状态说明代替');
        return state;
      }
      
      const returnDate = new Date().toISOString().split('T')[0];
      const isOnTime = !isOverdue(record.dueDate);
      
      const newStatus = damageReported ? 'damaged' : 'returned';
      
      const updatedRecords = state.borrowRecords.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            returnDate,
            status: newStatus,
            returnNote: trimmedReturnNote,
            damageReported,
            damageNote: damageReported ? trimmedDamageNote : '',
          };
        }
        return r;
      });
      
      let updatedTools = state.tools.map(tool => {
        if (tool.id === record.toolId) {
          if (damageReported) {
            return { ...tool, status: 'damaged' };
          }
          return { ...tool, status: 'available' };
        }
        return tool;
      });
      
      const user = state.users.find(u => u.id === record.userId);
      const updatedUsers = state.users.map(u => {
        if (u.id === record.userId && isOnTime) {
          return { ...u, onTimeReturn: u.onTimeReturn + 1 };
        }
        return u;
      });
      
      const newLogs = [{
        id: `log_${Date.now()}`,
        userId: state.currentUserId,
        userName: state.users.find(u => u.id === state.currentUserId)?.name || '',
        action: damageReported ? 'return_damaged' : 'return',
        targetType: 'tool',
        targetId: record.toolId,
        targetName: record.toolName,
        details: damageReported 
          ? `归还${record.toolName}，发现损坏：${trimmedDamageNote}` 
          : `归还${record.toolName}，状态正常`,
        time: new Date().toLocaleString('zh-CN'),
      }];
      
      let newMaintenanceRecords = [...state.maintenanceRecords];
      if (damageReported) {
        newMaintenanceRecords = [{
          id: `mr_${Date.now()}`,
          toolId: record.toolId,
          toolName: record.toolName,
          reporterId: record.userId,
          reporterName: user?.name || '',
          maintainerId: null,
          reportDate: returnDate,
          completeDate: null,
          status: 'reported',
          description: trimmedDamageNote,
          photoPlaceholder: true,
        }, ...newMaintenanceRecords];
      }
      
      return {
        ...state,
        borrowRecords: updatedRecords,
        tools: updatedTools,
        users: updatedUsers,
        operationLogs: [...newLogs, ...state.operationLogs],
        maintenanceRecords: newMaintenanceRecords,
      };
    }

    case 'START_MAINTENANCE': {
      const { recordId, maintainerId } = action.payload;
      const record = state.maintenanceRecords.find(r => r.id === recordId);
      if (!record) return state;
      
      const updatedRecords = state.maintenanceRecords.map(r => {
        if (r.id === recordId) {
          return { ...r, status: 'in_progress', maintainerId };
        }
        return r;
      });
      
      const updatedTools = state.tools.map(tool => {
        if (tool.id === record.toolId) {
          return { ...tool, status: 'maintenance' };
        }
        return tool;
      });
      
      const maintainer = state.users.find(u => u.id === maintainerId);
      const newLog = {
        id: `log_${Date.now()}`,
        userId: maintainerId,
        userName: maintainer?.name || '',
        action: 'start_maintenance',
        targetType: 'tool',
        targetId: record.toolId,
        targetName: record.toolName,
        details: `开始维修${record.toolName}`,
        time: new Date().toLocaleString('zh-CN'),
      };
      
      return {
        ...state,
        maintenanceRecords: updatedRecords,
        tools: updatedTools,
        operationLogs: [newLog, ...state.operationLogs],
      };
    }

    case 'COMPLETE_MAINTENANCE': {
      const { recordId } = action.payload;
      const record = state.maintenanceRecords.find(r => r.id === recordId);
      if (!record) return state;
      
      const completeDate = new Date().toISOString().split('T')[0];
      
      const updatedRecords = state.maintenanceRecords.map(r => {
        if (r.id === recordId) {
          return { ...r, status: 'completed', completeDate };
        }
        return r;
      });
      
      const updatedTools = state.tools.map(tool => {
        if (tool.id === record.toolId) {
          return { ...tool, status: 'available' };
        }
        return tool;
      });
      
      const newLog = {
        id: `log_${Date.now()}`,
        userId: state.currentUserId,
        userName: state.users.find(u => u.id === state.currentUserId)?.name || '',
        action: 'complete_maintenance',
        targetType: 'tool',
        targetId: record.toolId,
        targetName: record.toolName,
        details: `完成${record.toolName}的维修`,
        time: new Date().toLocaleString('zh-CN'),
      };
      
      return {
        ...state,
        maintenanceRecords: updatedRecords,
        tools: updatedTools,
        operationLogs: [newLog, ...state.operationLogs],
      };
    }

    case 'LOCK_TOOL': {
      const { toolId } = action.payload;
      const tool = state.tools.find(t => t.id === toolId);
      if (!tool) return state;
      
      const updatedTools = state.tools.map(t => {
        if (t.id === toolId) {
          return { ...t, locked: true, status: 'locked' };
        }
        return t;
      });
      
      const newLog = {
        id: `log_${Date.now()}`,
        userId: state.currentUserId,
        userName: state.users.find(u => u.id === state.currentUserId)?.name || '',
        action: 'lock',
        targetType: 'tool',
        targetId: toolId,
        targetName: tool.name,
        details: `锁定${tool.name}，暂停借用`,
        time: new Date().toLocaleString('zh-CN'),
      };
      
      return {
        ...state,
        tools: updatedTools,
        operationLogs: [newLog, ...state.operationLogs],
      };
    }

    case 'UNLOCK_TOOL': {
      const { toolId } = action.payload;
      const tool = state.tools.find(t => t.id === toolId);
      if (!tool) return state;
      
      let newStatus = 'available';
      const hasActiveMaintenance = state.maintenanceRecords.some(
        r => r.toolId === toolId && r.status !== 'completed'
      );
      if (hasActiveMaintenance) {
        newStatus = 'maintenance';
      }
      
      const updatedTools = state.tools.map(t => {
        if (t.id === toolId) {
          return { ...t, locked: false, status: newStatus };
        }
        return t;
      });
      
      const newLog = {
        id: `log_${Date.now()}`,
        userId: state.currentUserId,
        userName: state.users.find(u => u.id === state.currentUserId)?.name || '',
        action: 'unlock',
        targetType: 'tool',
        targetId: toolId,
        targetName: tool.name,
        details: `解锁${tool.name}，恢复借用`,
        time: new Date().toLocaleString('zh-CN'),
      };
      
      return {
        ...state,
        tools: updatedTools,
        operationLogs: [newLog, ...state.operationLogs],
      };
    }

    case 'RESET_STATE': {
      localStorage.removeItem(STORAGE_KEY);
      return getInitialState();
    }

    default:
      return state;
  }
}

function isOverdue(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);
  return today > dueDate;
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, getInitialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = {
    state,
    dispatch,
    
    currentUser: state.users.find(u => u.id === state.currentUserId),
    
    getToolById: (id) => state.tools.find(t => t.id === id),
    getCategoryById: (id) => state.categories.find(c => c.id === id),
    getUserById: (id) => state.users.find(u => u.id === id),
    
    hasOverdueRecords: (userId) => {
      return state.borrowRecords.some(
        r => r.userId === userId && r.status === 'borrowed' && isOverdue(r.dueDate)
      );
    },
    
    isOverdue,
    
    canBorrowTool: (toolId, userId) => {
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
    },
    
    getLeaderboard: () => {
      return [...state.users]
        .filter(u => u.role === 'resident')
        .sort((a, b) => b.borrowCount - a.borrowCount)
        .map((user, index) => ({ ...user, rank: index + 1 }));
    },
    
    getCartTotal: () => {
      return state.borrowCart.reduce((sum, item) => sum + item.deposit, 0);
    },
    
    getResidentBorrowRecords: (userId) => {
      return state.borrowRecords.filter(r => r.userId === userId);
    },
    
    getOverdueRecords: () => {
      return state.borrowRecords.filter(
        r => r.status === 'borrowed' && isOverdue(r.dueDate)
      );
    },
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
