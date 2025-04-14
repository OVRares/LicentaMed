import { Route, Routes } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import SignUpPage from "./Pages/SignUpPage";
import MainPage from "./Pages/MainPage";
import LoginPageDoc from "./Pages/LoginPageDoc";
import SignUpPageDoc from "./Pages/SignUpPageDoc";
import ConfirmationPageTest from "./Pages/ConfirmationPageTest";
import SearchPageTest from "./Pages/SearchPageTest";
import AddImageTest from "./Pages/AddImageTest";
import Profile from "./Pages/Profile";
import ChatPage from "./Pages/ChatPage";
import ChatList from "./Pages/ChatList";

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
        <Route path="/main" element={<MainPage />} />
        <Route path="/tconfirmation" element={<ConfirmationPageTest />} />
        <Route path="/search" element={<SearchPageTest />} />
        <Route path="/addImage" element={<AddImageTest />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chatlist" element={<ChatList />} />
      </Routes>
    </div>
  );
}

export default App;
