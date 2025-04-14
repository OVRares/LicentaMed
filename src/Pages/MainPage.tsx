import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import axios from "axios";
import Button from "../components/Button";
import Header from "../components/Header";

function MainPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<null | {
    uid: string;
    email: string;
    role: string;
  }>(null);
  const [error, setError] = useState("");
  const didCallEndpoint = useRef(false);

  const handleLogout = async (): Promise<void> => {
    try {
      const response = await axios.post(
        "http://localhost:5000/logout",
        {},
        { withCredentials: true }
      );

      console.log("Response:", response);
      console.log("Response Data:", response.data);

      if (response.status === 200) {
        console.log("Logout successful");
        navigate("/login");
      } else {
        console.error("Logout failed:", response.data);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  /// AICI

  useEffect(() => {
    if (didCallEndpoint.current) return;
    didCallEndpoint.current = true;

    console.log("Calling /session endpoint...");
    axios
      .get("http://localhost:5000/session", { withCredentials: true })
      .then((response) => {
        setUser(response.data.user);
        console.log("Session User:", response.data.user);
      })
      .catch((err) => {
        console.error("Error fetching session data:", err);
        setUser(null);
        setError("Failed to retrieve session info. Please log in again.");
      });
  }, []);
  if (error) {
    return <div>{error}</div>;
  }

  if (!setUser) {
    return <div>Loading...</div>; // Show loading state while fetching session data
  }

  return (
    <>
      <header className="header">
        <img src="/logo.png" alt="Logo" />

        {user ? (
          <>
            <Button onClick={() => navigate("/appointments")}>
              {user.role === "doc" ? "Pacienții mei" : "Programările mele"}
            </Button>

            <Button onClick={() => navigate("/chatlist")}>
              {user.role === "doc" ? "Lista Chat" : "Lista Chat"}
            </Button>

            <Button onClick={() => navigate("/chat")}>
              {user.role === "doc" ? "Chat Doc" : "Chat Reg"}
            </Button>

            <Button onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <Button onClick={() => navigate("/login")}>Login</Button>
        )}
      </header>

      <div className="center-container">
        <p>User ID: {user?.uid}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
        <Button onClick={handleLogout}>Log Out</Button>
      </div>
    </>
  );
}

export default MainPage;
