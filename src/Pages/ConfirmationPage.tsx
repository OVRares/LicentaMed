import axios from "axios";
import Button from "../components/Button";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function ConfirmationPage() {
  const [status, setStatus] = useState("loading");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    localStorage.removeItem("userRole");
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
    <div className="center-container">
      {status === "loading" && <h2>⏳ Verifying email...</h2>}
      {status === "success" && (
        <>
          <h2>✅ Email Confirmed!</h2>
          <p>Your email has been successfully verified. You can now log in.</p>
          <Button onClick={() => navigate("/login")} color="blue">
            Login
          </Button>
        </>
      )}
      {status === "error" && (
        <>
          <h2>❌ Confirmation Failed</h2>
          <p>The confirmation link is invalid or expired.</p>
        </>
      )}
    </div>
  );
}

export default ConfirmationPage;
