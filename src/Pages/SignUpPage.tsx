import TextBox from "../components/TextBox";
import "../App.css";
import { useState } from "react";
import Button from "../components/Button";
import Alert from "../components/Alert";
import DateOfBirthPicker from "../components/DateOfBirthPicker";
import emailjs from "emailjs-com";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bg1 from "../assets/bg1.jpg";

function SignUpPage() {
  const [passwordCheck, setPasswordCheck] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nume, setNume] = useState(""); // State for Nume
  const [prenume, setPrenume] = useState(""); // State for Prenume
  const [alertVisible, setAlertVisibility] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [age, setAge] = useState<number | null>(null); // ✅ Only storing age
  const navigate = useNavigate();

  const sendConfirmationEmail = async (
    user_email: string,
    confirmationToken: string
  ) => {
    const confirmationLink = `http://localhost:5000/confirmEmail?token=${confirmationToken}`;

    const emailParams = {
      to_email: user_email,
      confirmation_link: confirmationLink,
    };

    try {
      const response = await emailjs.send(
        "service_xe121us",
        "template_6l48wfv",
        emailParams,
        "aKbIrt8jhzXZx9LDI"
      );
      console.log(" Email sent successfully:", response);
    } catch (error) {
      console.error(" Error sending email:", error);
    }
  };

  const signupFinal = async () => {
    if (!nume.trim()) {
      setAlertText("Numele nu poate fi gol!");
      return;
    } else if (!prenume.trim()) {
      setAlertText("Prenumele nu poate fi gol!");
      return;
    } else if (!age) {
      setAlertText("Va rugam sa introduceti data nasterii!");
      return;
    } else if (age < 18) {
      setAlertText("Trebuie sa aveti minim 18 ani pentru a va crea un cont!");
      return;
    } else if (!email.trim()) {
      setAlertText("Emailul nu poate fi gol!");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlertText("Emailul nu este valid!");
      return;
    } else if (!password.trim()) {
      setAlertText("Parola nu poate fi goala!");
      return;
    } else if (password !== passwordCheck) {
      setAlertText("Parolele nu se potrivesc!");
      return;
    }

    const emailResponse = await axios.post("http://localhost:5000/checkEmail", {
      user_email: email,
    });

    if (emailResponse.data.exists) {
      setAlertText("Acest email este deja asociat unui alt cont.");
      return;
    }

    setAlertVisibility(false);
    setAlertText("");

    const id: string = Math.floor(
      10000000 + Math.random() * 90000000
    ).toString();

    try {
      const response = await axios.post("http://localhost:5000/signup", {
        user_nume: nume,
        user_prenume: prenume,
        user_varsta: age,
        user_id: id,
        user_email: email,
        user_parola: password,
      });

      const confirmationToken = response.data.confirmationToken;
      if (!confirmationToken) {
        throw new Error("No confirmation token received");
      }

      await sendConfirmationEmail(email, response.data.confirmationToken);
      console.log("Signed up successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Error signing up:", error);
      setAlertText("Failed to complete signup. Please try again.");
    }
  };

  return (
    <>
      <div className="page-background">
        <header className="header">
          <div className="header-left">
            <img
              src="src/assets/logo.png"
              alt="Company Logo"
              className="logo"
            />
          </div>
          <div className="header-center"></div>
        </header>
        <div className="center-container">
          <img
            src="src/assets/reg_signup.jpg"
            alt="Login Image"
            className="login-image-3"
          />
          <div className="signup-box-reg">
            <TextBox
              value={nume}
              onChange={(text) => setNume(text)}
              placeholder="Nume"
            ></TextBox>
            <TextBox
              value={prenume}
              onChange={(text) => setPrenume(text)}
              placeholder="Prenume"
            ></TextBox>

            <div className="mb-1">
              <small className="text-muted d-block mb-1">Data nașterii</small>
              <DateOfBirthPicker onDateChange={(age) => setAge(age)} />
            </div>

            <TextBox
              value={email}
              onChange={(text) => setEmail(text)}
              placeholder="E-Mail"
            ></TextBox>

            <TextBox
              value={password}
              onChange={(text) => setPassword(text)}
              placeholder="Parola"
              type="password"
            />

            <TextBox
              value={passwordCheck}
              onChange={(text) => setPasswordCheck(text)}
              placeholder="Confirmati Parola"
              type="password"
            />

            <Button onClick={signupFinal} color="blue">
              Sign Up
            </Button>

            {alertText && <Alert message={alertText} />}
          </div>
        </div>
      </div>
    </>
  );
}

export default SignUpPage;
