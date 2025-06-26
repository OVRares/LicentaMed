import Button from "../components/Button";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ConfirmationPageTest() {
  const [status, setStatus] = useState("loading");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    
    navigate("/login");
  };

  useEffect(() => {
    const confirmationStatus = searchParams.get("status");
    if (confirmationStatus === "success") {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img src="src/assets/logo.png" alt="Company Logo" className="logo" />
        </div>
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
        </div>
        <div className="header-right">
          <Button onClick={handleLogout} color="blue">
            Logout
          </Button>
        </div>
      </header>

      <div className="center-container">
        {status === "success" ? (
          <div className="redirect-box">
            <img
              src="src/assets/check.png"
              alt="Check Image"
              className="redirect-image"
            />
            <h2>E-Mail confirmat!</h2>
            <p>E-Mailul dumneavoastră a fost confirmat cu succes.</p>
            <Button onClick={() => navigate("/login")} color="blue">
              Întoarcere la pagina de login
            </Button>
          </div>
        ) : status === "error" ? (
          <div className="redirect-box">
            <img
              src="src/assets/error.png"
              alt="Error Image"
              className="redirect-image"
            />
            <h2>Eroare la confirmare</h2>
            <p>Link-ul de confirmare este invalid sau expirat.</p>
            <Button onClick={() => navigate("/signup")} color="blue">
              Încearcă din nou
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default ConfirmationPageTest;
