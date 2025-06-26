import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";
import axios from "axios";
import Button from "../components/Button";
import { StreamChat } from "stream-chat";

function MainPage2() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<null | {
    uid: string;
    email: string;
    role: string;
    name: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const didCallEndpoint = useRef(false);

  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.role !== "reg") {
      console.log("Fetching today's appointments for:", user.uid); // ✅ LOG

      axios
        .get("http://localhost:5000/appointmentsTodayCount", {
          params: { doc_id: user.uid },
          withCredentials: true,
        })
        .then((res) => {
          console.log("Appointment count response:", res.data); // ✅ LOG
          setTodayCount(res.data.count);
        })
        .catch((err) => {
          console.error("Error fetching appointment count:", err); // ✅ LOG
          setTodayCount(0);
        });
    }
  }, [user]);

  const handleLogout = async (): Promise<void> => {
    try {
      const client = StreamChat.getInstance("vs9hb5583yhf");

      if (client.userID) {
        await client.disconnectUser();
        console.log("Disconnected from StreamChat");
      }

      await axios.post(
        "http://localhost:5000/logout",
        {},
        { withCredentials: true }
      );
      client?.disconnectUser;
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    if (didCallEndpoint.current) return;
    didCallEndpoint.current = true;

    axios
      .get("http://localhost:5000/session", { withCredentials: true })
      .then((response) => {
        setUser(response.data.user || null);
      })
      .catch((error) => {
        console.warn("No session found, continuing as guest.");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="page-wrapper">
        <header className="header">
          <div
            className="header-left"
            style={{ display: "flex", alignItems: "center" }}
          >
            <img
              src="src/assets/Minerva2.png"
              alt="Company Logo"
              className="logo"
            />
            <span className="logo-text">MinervaMed</span>
          </div>

          <div className="header-center">
            {user ? (
              <>
                <Button
                  width="80px"
                  variant="filled-alt"
                  onClick={() => navigate("/main2")}
                  color="blue"
                  selected={location.pathname === "/main2"}
                >
                  Home
                </Button>
                <Button
                  color="blue"
                  variant="filled-alt"
                  onClick={() =>
                    navigate(
                      user.role === "reg"
                        ? "/appointments_reg"
                        : "/appointments_doc"
                    )
                  }
                >
                  Appointments
                </Button>
                <Button
                  width="80px"
                  color="blue"
                  variant="filled-alt"
                  onClick={() =>
                    navigate(
                      user.role === "reg" ? "/rsplitchats" : "/splitchats"
                    )
                  }
                >
                  Chat
                </Button>

                <Button
                  width={user.role === "doc" ? "80px" : "110px"}
                  color="blue"
                  variant="filled-alt"
                  onClick={() =>
                    navigate(user.role === "reg" ? "/search" : "/testscheduler")
                  }
                >
                  {user.role === "reg" ? "Search" : "Scheduler"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="blue"
                  variant="filled-alt"
                  onClick={() => navigate("/login")}
                >
                  Home
                </Button>
                <Button
                  color="blue"
                  variant="filled-alt"
                  onClick={() => navigate("/login")}
                >
                  Appointments
                </Button>
                <Button
                  color="blue"
                  variant="filled-alt"
                  onClick={() => navigate("/login")}
                >
                  Chat
                </Button>
                <Button
                  color="blue"
                  variant="filled-alt"
                  onClick={() => navigate("/login")}
                >
                  Search
                </Button>
              </>
            )}
          </div>

          <div className="header-right">
            {user ? (
              <>
                {user && user.role !== "reg" && (
                  <button
                    className="round-button"
                    onClick={() => navigate("/about")}
                    title="Profile"
                  >
                    <img
                      src="src/assets/user.png"
                      alt=""
                      className="round-button-icon"
                    />
                  </button>
                )}
                <Button
                  color="blue"
                  variant="filled-alt"
                  width="80px"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                color="blue"
                variant="filled-alt"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            )}
          </div>
        </header>

        <div className="hero-banner">
          <div className="hero-text-box">
            <h1 className="welcome-heading">
              {user ? (
                <>
                  Good day,{" "}
                  <span className="highlight">
                    {user.role === "reg" ? user.name : `Dr. ${user.name}`}!
                  </span>
                </>
              ) : (
                <>
                  Welcome to <span className="highlight">MinervaMed</span>
                </>
              )}
            </h1>

            <div className="separator-line"></div>
            <p className="welcome-subtext">
              {user
                ? user.role !== "reg" && todayCount !== null
                  ? `You have ${todayCount} appointment${
                      todayCount !== 1 ? "s" : ""
                    } today.`
                  : "Welcome back to MinervaMed"
                : "The wise way to manage your health, one click away."}
            </p>

            <div className="cta-buttons">
              {!user && (
                <Button
                  color="blue"
                  variant="regular"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
              )}
              {!user && (
                <Button
                  color="blue"
                  variant="filled"
                  onClick={() => navigate("/signupDoc")}
                >
                  Sign Up as Doctor
                </Button>
              )}
              {!user && (
                <Button
                  color="blue"
                  variant="filled"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up as Patient
                </Button>
              )}
            </div>
          </div>
        </div>
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-column">
              <h4>About Us</h4>
              <p>
                MinervaMed is a modern healthcare platform that connects
                patients and doctors with ease. We strive to simplify medical
                appointments, communication, and care.
              </p>
            </div>

            <div className="footer-column">
              <h4>Contact</h4>
              <p>📞 Phone: +40 123 456 789</p>
              <p>📧 Email: contact@minervamed.ro</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default MainPage2;
