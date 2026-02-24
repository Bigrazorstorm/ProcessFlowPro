import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="flex items-center justify-center h-screen"><h1 className="text-4xl font-bold text-gray-800">ProcessFlow Pro</h1></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
