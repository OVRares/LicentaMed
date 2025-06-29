import { useState } from "react";
import TextBox from "../components/TextBox";
import "../App.css";
import ClickLink from "../components/ClickLink";
import Button from "../components/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import { useLocation } from "react-router-dom";
import { StreamChat } from "stream-chat";

function LoginPage() {
  const [alertVisible, setAlertVisibility] = useState(false);
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [alertText, setAlertText] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSignIn();
    }
  };

  const handleSignIn = async (): Promise<void> => {
    if (!email.trim()) {
      setAlertText("E-Mailul nu poate fi gol!");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlertText("Emailul nu este valid!");
      return;
    } else if (!parola.trim()) {
      setAlertText("Parola nu poate fi goala!");
      return;
    }

    setAlertVisibility(false);
    setAlertText("");

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        {
          user_email: email,
          user_parola: parola,
        },
        { withCredentials: true }
      );

      console.log("Response:", response);
      console.log("Response Data:", response.data);

      if (response.status === 200 && response.data.exists) {
        console.log("Login successful");
        localStorage.setItem("userRole", "reg");

        const tokenResponse = await axios.post(
          "http://localhost:5000/api/chat/chatStartReg",
          { email: email },
          { withCredentials: true }
        );
        console.log("Stream Token Response:", tokenResponse.data);

        if (tokenResponse.status === 200) {
          const { token, user } = tokenResponse.data;

          localStorage.setItem("streamToken", token);
          console.log("Stream Token:", token);
          localStorage.setItem("streamUser", JSON.stringify(user));

          const client = StreamChat.getInstance("vs9hb5583yhf");
          await client.connectUser(user, token);

          navigate("/main2");
        } else {
          setAlertText("Failed to get Stream token. Please try again.");
          setAlertVisibility(true);
        }
      } else {
        setAlertText("Invalid email or password. Please try again.");
        setAlertVisibility(true);
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="login-page-background">
          <header className="header">
            <div className="header-left">
              <img
                src="src/assets/Minerva2.png"
                alt="Company Logo"
                className="logo"
              />
              <span className="logo-text">MinervaMed</span>
            </div>
            <div className="header-center"></div>
          </header>

          <div className="center-container">
            <div className="login-box">
              <div className="title-row">
                <h2 className="login-title">Login to MinervaMed</h2>
              </div>

              <div className="redirect-buttons">
                <Button
                  onClick={() => navigate("/login")}
                  color="blue"
                  variant="filled"
                  selected={
                    location.pathname === "/login" || location.pathname === "/"
                  }
                  icon={
                    location.pathname === "/login" || location.pathname === "/"
                      ? "src/assets/pacient-set.png"
                      : "src/assets/pacient.png"
                  }
                >
                  Login Pacient
                </Button>
                <Button
                  onClick={() => navigate("/loginDoc")}
                  color="blue"
                  selected={location.pathname === "/doctor-login"}
                  variant="filled"
                  icon={
                    location.pathname === "/doctor-login"
                      ? "src/assets/doctor-set.png"
                      : "src/assets/doctor.png"
                  }
                  hoverIcon="src/assets/doctor-set.png"
                >
                  Login Doctor
                </Button>
              </div>

              <div className="separator"></div>
              <TextBox
                value={email}
                onChange={(text) => setEmail(text)}
                placeholder="E-Mail"
              ></TextBox>
              <TextBox
                value={parola}
                onChange={(text) => setParola(text)}
                placeholder="Parola"
                type="password"
                onKeyDown={handleKeyDown}
              ></TextBox>
              <Button onClick={handleSignIn} type="submit" color="blue">
                Log In
              </Button>

              <ClickLink redirectTo="/signup" />

              {alertText && <Alert message={alertText} />}
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

export default LoginPage;
