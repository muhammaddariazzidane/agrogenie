import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import PromotionAI from "./pages/PromotionAI";
import VoicePOS from "./pages/VoicePOS";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<PromotionAI />} />

          <Route path="/voice" element={<VoicePOS />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
