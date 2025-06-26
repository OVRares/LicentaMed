import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";
import axios from "axios";
import Button from "../components/Button";
import { StreamChat } from "stream-chat";

function MainPage() {
  const location = useLocation();
  const isHomePage = location.pathname === "/main";
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
      const client = StreamChat.getInstance("vs9hb5583yhf");

      if (client.userID) {
        await client.disconnectUser();
        console.log("Disconnected from StreamChat");
      }

      // const del = await axios.post(
      //   "http://localhost:5000/api/chat/delete-test-users",
      //   {},
      //   {
      //     withCredentials: true,
      //   }
      // );

      // console.log("Delete response:", del.data);

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
      <header className={`header ${isHomePage ? "" : ""}`}>
        <img src="src/assets/Minerva2.png" alt="Logo" className="logo" />

        {user ? (
          <>
            <Button
              width="160px"
              onClick={() =>
                navigate(
                  user.role === "doc"
                    ? "/appointments_doc"
                    : "/appointments_reg"
                )
              }
            >
              Programările mele
            </Button>
            <Button
              width="160px"
              onClick={() =>
                navigate(user.role === "doc" ? "/splitchats" : "/rsplitchats")
              }
            >
              Chat
            </Button>
            <Button
              width="160px"
              onClick={() =>
                navigate(user.role === "doc" ? "/scheduler" : "/search")
              }
            >
              {user.role === "doc" ? "Calendarul Meu" : "Cautare Doctor"}
            </Button>
            <Button width="80px" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate("/login")}>Login</Button>
        )}
      </header>

      <div className="hero-banner">
        <div className="hero-text-box">
          <h1 className="welcome-heading">Hello, {user?.uid}</h1>
          <p className="welcome-subtext">Welcome back to MinervaMed</p>
          <Button onClick={handleLogout}>Log Out</Button>
        </div>
      </div>
    </>
  );
}

export default MainPage;
