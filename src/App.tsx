import { Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPageReg";
import SignUpPage from "./Pages/SignUpPageReg";
import LoginPageDoc from "./Pages/LoginPageDoc";
import SignUpPageDoc from "./Pages/SignUpPageDoc";
import ConfirmationPageTest from "./Pages/ConfirmationPageTest";
import SearchPageTest from "./Pages/SearchPage";
import Profile from "./Pages/Profile";
import ChatSplitPage from "./Pages/ChatSplitPageDoc";
import ChatSplitPageReg from "./Pages/ChatSplitPageReg";
import DoctorAppointmentsPage from "./Pages/AppointmentsPageDoc";
import PatientAppointmentsPage from "./Pages/AppointmentsPageReg";
import AppointmentGridModal from "./Pages/AppointmentGrid";
import MainPage2 from "./Pages/MainPage2";
import DoctorAbout from "./Pages/DoctorAbout";
import UnauthorizedPage from "./Pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";
import { Chat } from "stream-chat-react";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<MainPage2 />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signupDoc" element={<SignUpPageDoc />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/loginDoc" element={<LoginPageDoc />} />
        <Route path="/tconfirmation" element={<ConfirmationPageTest />} />
        <Route
          path="/search"
          element={
            <ProtectedRoute allowedRoles={["reg"]}>
              <SearchPageTest />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/splitchats"
          element={
            <ProtectedRoute allowedRoles={["doc"]}>
              <ChatSplitPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rsplitchats"
          element={
            <ProtectedRoute allowedRoles={["reg"]}>
              <ChatSplitPageReg />
            </ProtectedRoute>
          }
        />
        <Route
          path="/testscheduler"
          element={
            <ProtectedRoute allowedRoles={["doc"]}>
              <AppointmentGridModal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments_doc"
          element={
            <ProtectedRoute allowedRoles={["doc"]}>
              <DoctorAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments_reg"
          element={
            <ProtectedRoute allowedRoles={["reg"]}>
              <PatientAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/main2" element={<MainPage2 />} />
        <Route path="/about" element={<DoctorAbout />} />
        <Route path="/doctor-about/:doctorId" element={<DoctorAbout />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Routes>
    </div>
  );
}

export default App;
