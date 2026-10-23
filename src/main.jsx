import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
class ErrorBoundary extends React.Component {
  state={error:null};
  static getDerivedStateFromError(error){return {error};}
  render(){return this.state.error?<main style={{margin:30}}><h1>เปิดหน้าจอไม่สำเร็จ</h1><p>ข้อมูลเดิมยังอยู่ในเครื่อง ลองโหลดหน้าใหม่ หรือส่งไฟล์สำรองให้ผู้พัฒนาตรวจสอบ</p><button onClick={()=>location.reload()}>โหลดใหม่</button></main>:this.props.children;}
}
createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
