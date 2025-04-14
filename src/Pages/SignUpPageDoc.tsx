import TextBox from "../components/TextBox";
import "../App.css";
import { useState } from "react";
import Button from "../components/Button";
import Alert from "../components/Alert";
import SpecPicker from "../components/SpecPicker";
import emailjs from "emailjs-com";
import axios from "axios";
import JudetPicker from "../components/JudetPicker";
import { useNavigate } from "react-router-dom";

function SignUpPageDoc() {
  const [step, setStep] = useState(1);
  const [passwordCheck, setPasswordCheck] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nume, setNume] = useState(""); // State for Nume
  const [prenume, setPrenume] = useState(""); // State for Prenume
  const [alertVisible, setAlertVisibility] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [spec, setSelectedSpec] = useState<string>("");
  const [spec_id, setSpecId] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [city, setOfficeCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const navigate = useNavigate();

  const getPlaceholder = () => {
    switch (spec) {
      case "KIN":
        return "Cod CFZRO";
      case "FAM":
        return "Cod CMR";
      case "DEN":
        return "Cod CSMR";
      default:
        return "Cod Identificare (CSMR/CMR/CFZRO)";
    }
  };

  function handleOptionSelect(option: string) {
    setSelectedSpec(option);
  }

  const handleNextStep = async () => {
    if (!nume.trim()) {
      setAlertText("Numele nu poate fi gol!");
      return;
    } else if (!prenume.trim()) {
      setAlertText("Prenumele nu poate fi gol!");
      return;
    } else if (!email.trim()) {
      setAlertText("Emailul nu poate fi gol!");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAlertText("Emailul nu este valid!");
      return;
    } else if (!password.trim()) {
      setAlertText("Parola nu poate fi goala!");
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

    setAlertText("");
    setAlertVisibility(false);
    setStep(2);
  };

  const signupFinal = async () => {
    if (!officeName.trim()) {
      setAlertText("Denumirea cabinetului nu poate fi goala!");
    } else if (!city.trim()) {
      setAlertText("Orasul nu poate fi gol!");
    } else if (!address.trim()) {
      setAlertText("Adresa nu poate fi goala!");
    } else if (!phone.trim()) {
      setAlertText("Numarul de telefon nu poate fi gol!");
    } else {
      setAlertVisibility(false);

      const id: string = Math.floor(
        10000000 + Math.random() * 90000000
      ).toString();

      const off_id: string = Math.floor(
        10000000 + Math.random() * 90000000
      ).toString();

      // const emailParams = {
      //   to_email: email, // The user's email address
      //   user_nume: nume, // User's first name
      //   user_prenume: prenume, // User's last name
      //   user_cnp: cnp, // User's CNP
      //   user_dob: `${dob.day} ${dob.month} ${dob.year}`, // User's Date of Birth
      //   user_id: randomId,
      // };

      // await emailjs.send(
      //   "service_xe121us", // Replace with your Email.js service ID
      //   "template_6l48wfv", // Replace with your Email.js template ID
      //   emailParams,
      //   "aKbIrt8jhzXZx9LDI" // Replace with your Email.js user ID
      // );

      //console.log("Email sent successfully!");
      try {
        await axios.post("http://localhost:5000/signupDoctorWithOffice", {
          office_id: off_id,
          office_nume: officeName,
          office_judet: county,
          office_oras: city,
          office_adr: address,
          office_tel: phone,
          office_spec: spec,
          user_id: id,
          user_nume: nume,
          user_prenume: prenume,
          user_email: email,
          user_spec: spec,
          user_spec_id: spec_id,
          user_parola: password,
        });

        setAlertText("Contul a fost creat cu succes!");
        navigate("/loginDoc");
      } catch (error) {
        setAlertText("A aparut o eroare la inregistrare!");
      }
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
        {step === 1 ? (
          <>
            <img
              src="src/assets/doc-alt.jpg"
              alt="Login Image"
              className="login-image-1"
            />
            <div className="signup-box-doc">
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

              <SpecPicker value={spec} onOptionSelect={handleOptionSelect} />
              <TextBox
                value={spec_id}
                onChange={(text) => setSpecId(text)}
                placeholder={getPlaceholder()}
              ></TextBox>

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

              <Button onClick={handleNextStep} color="blue">
                Urmator
              </Button>

              {alertText && <Alert message={alertText} />}
            </div>
          </>
        ) : (
          <>
            <img
              src="src/assets/office_signup_2.jpg"
              alt="Login Image"
              className="login-image-2"
            />

            <div className="signup-box-office">
              <TextBox
                value={officeName}
                onChange={(text) => setOfficeName(text)}
                placeholder="Denumire Cabinet"
              />

              <JudetPicker value={county} onOptionSelect={setCounty} />

              <TextBox
                value={city}
                onChange={(text) => setOfficeCity(text)}
                placeholder="Oras"
              />
              <TextBox
                value={address}
                onChange={(text) => setAddress(text)}
                placeholder="Adresa"
              />
              <TextBox
                value={phone}
                onChange={(text) => setPhone(text)}
                placeholder="Telefon"
              />
              <Button onClick={signupFinal} color="blue">
                Confirm & Register
              </Button>
              {alertText && <Alert message={alertText} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default SignUpPageDoc;
