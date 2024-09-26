import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Layout } from './pages/Layout';
import Home from './pages/Home';
import Incomes from './pages/Incomes';
import Outcomes from './pages/Outcomes';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Menu from './pages/Menu';
import Users from './pages/Users';
import Interns from './pages/Interns';
import Help from './pages/Help';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="incomes" element={<Incomes />} />
          <Route path="outcomes" element={<Outcomes />} />
          <Route path="products" element={<Products />} />
          <Route path="reports" element={<Reports />} />
          <Route path="menu" element={<Menu />} />
          <Route path="users" element={<Users />} />
          <Route path="interns" element={<Interns />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;