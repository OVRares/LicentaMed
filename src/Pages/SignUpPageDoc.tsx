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
  const [nume, setNume] = useState("");
  const [prenume, setPrenume] = useState("");
  const [alertVisible, setAlertVisibility] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [spec, setSelectedSpec] = useState<string>("");
  const [spec_id, setSpecId] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [city, setOfficeCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [officeCode, setOfficeCode] = useState("");
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
    } else if (!spec) {
      setAlertText("Trebuie să selectați o specialitate!");
      return;
    } else if (!spec_id.trim()) {
      setAlertText("Codul de identificare (CMR/CSMR/CFZRO) nu poate fi gol!");
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
    } else if (
      !/^.*(?=(?:.*[A-Za-z]){4,})(?=(?:.*\d){2,})(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?~\\/-]).*$/.test(
        password
      )
    ) {
      setAlertText(
        "Parola trebuie să conțină cel puțin 4 litere, 2 cifre și un caracter special!"
      );
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

    setAlertText("");
    setAlertVisibility(false);
    setStep(2);
  };

  const signupFinal = async () => {
    if (officeCode.trim()) {
      try {
        const id = `DOC${Math.floor(10000000 + Math.random() * 9_000000)}`;

        await axios.post("http://localhost:5000/signupDoctorWithOffice", {
          office_id: officeCode.trim(),
          user_id: id,
          user_nume: nume,
          user_prenume: prenume,
          user_email: email,
          user_spec: spec,
          user_spec_id: spec_id,
          user_parola: password,
        });

        navigate("/loginDoc");
      } catch (e) {
        setAlertText("Codul de cabinet nu a fost găsit!");
      }
      return;
    }

    if (!officeName.trim()) {
      setAlertText("Denumirea cabinetului nu poate fi goala!");
      return;
    }
    if (!city.trim()) {
      setAlertText("Orasul nu poate fi gol!");
      return;
    }
    if (!address.trim()) {
      setAlertText("Adresa nu poate fi goala!");
      return;
    }

    const office_id = Math.floor(
      10000000 + Math.random() * 9_000000
    ).toString();
    const user_id = `DOC${Math.floor(10000000 + Math.random() * 9_000000)}`;

    try {
      await axios.post("http://localhost:5000/signupDoctorWithOffice", {
        office_id,
        office_nume: officeName,
        office_judet: county,
        office_oras: city,
        office_adr: address,
        user_id,
        user_nume: nume,
        user_prenume: prenume,
        user_email: email,
        user_spec: spec,
        user_spec_id: spec_id,
        user_parola: password,
      });

      navigate("/loginDoc");
    } catch {
      setAlertText("A apărut o eroare la înregistrare!");
    }
  };

  return (
    <>
      <div className="page-wrapper">
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
          {step === 1 ? (
            <>
              <div className="signup-box-doc">
                <h2 className="signup-step-title">Informații Personale</h2>
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
                  placeholder="Cod Registru Unic Național"
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
              <div className="page-wrapper"></div>
              <div className="signup-box-office">
                <h2 className="signup-step-title">Informații Cabinet</h2>
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

                <div className="or-separator">
                  <hr className="line" />
                  <span className="or-label">SAU</span>
                  <hr className="line" />
                </div>

                <TextBox
                  value={officeCode}
                  onChange={setOfficeCode}
                  placeholder="Cod cabinet (opțional)"
                />

                <Button onClick={signupFinal} color="blue">
                  Confirm & Register
                </Button>

                {alertText && <Alert message={alertText} />}
              </div>
            </>
          )}
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

export default SignUpPageDoc;
