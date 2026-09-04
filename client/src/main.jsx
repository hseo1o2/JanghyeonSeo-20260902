import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { warmupHealth } from './api/client.js';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Experiment from './pages/Experiment.jsx';
import Matches from './pages/Matches.jsx';
import LogRoom from './pages/LogRoom.jsx';
import './global.css';

warmupHealth();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/discover" element={<Experiment />} />
        <Route path="/experiment" element={<Experiment />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/log/:candidateId" element={<LogRoom />} />
        <Route path="/complete" element={<Matches />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
