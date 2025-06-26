import { Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import SignUpPage from "./Pages/SignUpPage";
import LoginPageDoc from "./Pages/LoginPageDoc";
import SignUpPageDoc from "./Pages/SignUpPageDoc";
import ConfirmationPageTest from "./Pages/ConfirmationPageTest";
import SearchPageTest from "./Pages/SearchPageTest";
import Profile from "./Pages/Profile";
import ChatPage from "./Pages/ChatPage";
import ChatSplitPage from "./Pages/ChatSplitPage";
import ChatSplitPageReg from "./Pages/ChatSplitPageReg";
import DoctorAppointmentsPage from "./Pages/DoctorAppointmentsPage";
import PatientAppointmentsPage from "./Pages/PatientAppointmentsPage";
import AppointmentGridModal from "./Pages/mAppointmentGridModal";
import MainPage2 from "./Pages/MainPage2";
import DoctorAbout from "./Pages/DoctorAbout";

import "./App.css";
import { Chat } from "stream-chat-react";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signupDoc" element={<SignUpPageDoc />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/loginDoc" element={<LoginPageDoc />} />
        <Route path="/tconfirmation" element={<ConfirmationPageTest />} />
        <Route path="/search" element={<SearchPageTest />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat/:channelId" element={<ChatPage />} />
        <Route path="/splitchats" element={<ChatSplitPage />} />
        <Route path="/rsplitchats" element={<ChatSplitPageReg />} />
        <Route path="/testscheduler" element={<AppointmentGridModal />} />
        <Route path="/appointments_doc" element={<DoctorAppointmentsPage />} />
        <Route path="/appointments_reg" element={<PatientAppointmentsPage />} />
        <Route path="/main2" element={<MainPage2 />} />
        <Route path="/about" element={<DoctorAbout />} />
        <Route path="/doctor-about/:doctorId" element={<DoctorAbout />} />
      </Routes>
    </div>
  );
}

export default App;
