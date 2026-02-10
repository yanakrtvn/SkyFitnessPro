import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import AuthPage from './pages/AuthPage/AuthPage';
import ProgramPage from './pages/ProgramPage/ProgramPage';
import WorkoutsPage from './pages/WorkoutsPage/WorkoutsPage';
import AccountPage from './pages/AccountPage/AccountPage';
import TrainingPage from './pages/TrainingPage/TrainingPage';
import AuthModal from './components/AuthModal/AuthModal';

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route path="/login" element={<AuthPage />} />
        <Route 
          path="/course/:id" 
          element={<ProgramPage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route 
          path="/course/:courseId/workouts" 
          element={<WorkoutsPage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route 
          path="/profile" 
          element={<AccountPage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route 
          path="/course/:courseId/workout/:workoutId" 
          element={<TrainingPage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
      </Routes>
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

export default App;