import { useState } from "react";
import TextBox from "../components/TextBox";
import "../App.css";
import ClickLink from "../components/ClickLink";
import Button from "../components/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";
import { useLocation } from "react-router-dom";

function LoginPageDoc() {
  const [alertVisible, setAlertVisibility] = useState(false);
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [alertText, setAlertText] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [spec_id, setSpecId] = useState("");

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    navigate("/login");
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
        "http://localhost:5000/loginDoc",
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
        navigate("/main");
      } else {
        setAlertText("Invalid email or password. Please try again.");
        setAlertVisibility(true);
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // ✅ Prevents page refresh
      handleSignIn(); // ✅ Calls login function
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img src="src/assets/logo.png" alt="Company Logo" className="logo" />
        </div>
        <div className="header-center"></div>
      </header>

      <div className="center-container">
        <div className="login-box">
          <div className="title-row">
            <img src="src/assets/logo.png" alt="Logo" className="logo" />
            <h2 className="login-title">Placeholder - Login</h2>
          </div>

          <div className="redirect-buttons">
            <Button
              onClick={() => navigate("/login")}
              color="blue"
              variant="filled"
              selected={location.pathname === "/login"}
              icon={
                location.pathname === "/login" || location.pathname === "/"
                  ? "src/assets/pacient-set.png"
                  : "src/assets/pacient.png"
              }
              hoverIcon="src/assets/pacient-set.png"
            >
              Login Pacient
            </Button>
            <Button
              onClick={() => navigate("/loginDoc")}
              color="blue"
              variant="filled"
              selected={location.pathname === "/loginDoc"}
              icon={
                location.pathname === "/loginDoc"
                  ? "src/assets/doctor-set.png"
                  : "src/assets/doctor.png"
              }
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
          <Button variant="regular" onClick={handleSignIn} color="blue">
            Log In
          </Button>

          <ClickLink redirectTo="/signupDoc" />

          {alertText && <Alert message={alertText} />}
        </div>
      </div>
    </>
  );
}

export default LoginPageDoc;
