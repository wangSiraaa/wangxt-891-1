import React, { useState } from 'react';
import { useAppState } from './store/AppStateContext.jsx';
import Header from './components/Header.jsx';
import NavTabs from './components/NavTabs.jsx';
import ToolList from './pages/ToolList.jsx';
import ToolDetail from './pages/ToolDetail.jsx';
import BorrowCart from './pages/BorrowCart.jsx';
import MyRecords from './pages/MyRecords.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import OperationLogs from './pages/OperationLogs.jsx';
import ReturnModal from './components/ReturnModal.jsx';
import Alert from './components/Alert.jsx';

function App() {
  const { state, currentUser } = useAppState();
  const [activeTab, setActiveTab] = useState('tools');
  const [selectedToolId, setSelectedToolId] = useState(null);
  const [returnRecordId, setReturnRecordId] = useState(null);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleToolClick = (toolId) => {
    setSelectedToolId(toolId);
  };

  const handleCloseDetail = () => {
    setSelectedToolId(null);
  };

  const handleReturnClick = (recordId) => {
    setReturnRecordId(recordId);
  };

  const handleCloseReturn = () => {
    setReturnRecordId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tools':
        return <ToolList onToolClick={handleToolClick} showAlert={showAlert} />;
      case 'cart':
        return <BorrowCart showAlert={showAlert} />;
      case 'records':
        return <MyRecords onReturn={handleReturnClick} showAlert={showAlert} />;
      case 'maintenance':
        return <Maintenance showAlert={showAlert} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'logs':
        return <OperationLogs />;
      default:
        return <ToolList onToolClick={handleToolClick} showAlert={showAlert} />;
    }
  };

  return (
    <div className="app-container">
      <Header />
      
      {alert && (
        <Alert type={alert.type} message={alert.message} />
      )}
      
      <NavTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        role={currentUser?.role}
      />
      
      <div className="main-content">
        {renderContent()}
      </div>
      
      {selectedToolId && (
        <ToolDetail 
          toolId={selectedToolId} 
          onClose={handleCloseDetail}
          showAlert={showAlert}
        />
      )}
      
      {returnRecordId && (
        <ReturnModal
          recordId={returnRecordId}
          onClose={handleCloseReturn}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}

export default App;
