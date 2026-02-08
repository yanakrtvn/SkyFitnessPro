import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthModal from './components/AuthModal/AuthModal';

// Заглушки для тестирования
const HomePage = ({ onOpenAuth }) => (
  <div>
    <h1>Home Page</h1>
    <button onClick={onOpenAuth}>Open Auth</button>
  </div>
);

const LoginPage = () => <h1>Login Page</h1>;
const CoursePage = ({ onOpenAuth }) => <h1>Course Page</h1>;
const CourseWorkoutsPage = ({ onOpenAuth }) => <h1>Course Workouts Page</h1>;
const ProfilePage = ({ onOpenAuth }) => <h1>Profile Page</h1>;
const WorkoutPage = ({ onOpenAuth }) => <h1>Workout Page</h1>;

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={<HomePage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/course/:id" 
          element={<CoursePage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route 
          path="/course/:courseId/workouts" 
          element={<CourseWorkoutsPage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route 
          path="/profile" 
          element={<ProfilePage onOpenAuth={() => setAuthModalOpen(true)} />} 
        />
        <Route 
          path="/course/:courseId/workout/:workoutId" 
          element={<WorkoutPage onOpenAuth={() => setAuthModalOpen(true)} />} 
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