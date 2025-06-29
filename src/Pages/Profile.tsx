import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { response } from "express";

function Profile() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<{
    uid: string;
    email: string;
    role: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Retrieving session data...");
    axios
      .get("http://localhost:5000/session", { withCredentials: true })
      .then((response) => {
        setSessionData(response.data.user);
        console.log(response.data.user);
      })
      .catch((err) => {
        console.error("Error fetching session data:", err);
        setError("Failed to retrieve session info. Please log in again.");
      });
  }, []);

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img src="src/assets/logo.png" alt="Company Logo" className="logo" />
        </div>
        <span className="logo-text">MinervaMed</span>
        <div className="header-center">
          <Button
            onClick={() => navigate("/login")}
            color="blue"
            selected={location.pathname === "/tconfirmation"}
          >
            Acasa
          </Button>
          <Button onClick={() => navigate("/login")} color="blue">
            Programarile Mele
          </Button>
          <Button onClick={() => navigate("/login")} color="blue">
            Cautare
          </Button>
          <Button onClick={() => navigate("/profile")} color="blue">
            Profilul Meu
          </Button>
        </div>
        <div className="header-right">
          <Button onClick={handleLogout} color="blue">
            Logout
          </Button>
        </div>
      </header>

      <div className="center-container">
        {sessionData ? (
          <>
            <p>User ID: {sessionData.uid}</p>
            <p>Email: {sessionData.email}</p>
            <p>Role: {sessionData.role}</p>
          </>
        ) : (
          <p>Loading session...</p>
        )}
        <Button onClick={handleLogout}>Log Out</Button>
      </div>
    </>
  );
}

export default Profile;
