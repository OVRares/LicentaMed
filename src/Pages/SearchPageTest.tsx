import React, { useState, useEffect } from "react";
import TextBox from "../components/TextBox";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { StreamChat } from "stream-chat";
import SpecPicker from "../components/SpecPicker";
import JudetPicker from "../components/JudetPicker";
import { off } from "process";

function SearchPageTest() {
  const [judet, setJudet] = useState("");
  const [spec, setSpec] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  interface Office {
    office_id: number;
    office_nume: string;
    oras: string;
    judet: string;
    adresa: string;
    tel: string;
    doctor_id: string;
    doctor_nume: string;
    doctor_prenume: string;
    doctor_spec: string;
    doctor_bio: string;
    profile_picture: string;
  }

  const getSpecLabel = (code: string): string => {
    switch (code) {
      case "KIN":
        return "Kinetoterapie";
      case "FAM":
        return "Medicină de Familie";
      case "DEN":
        return "Medicină Dentară";
      case "DRM":
        return "Dermatologie";
      case "OFT":
        return "Oftalmologie";
      case "ORL":
        return "ORL";
      case "PSI":
        return "Psihologie";
      case "NEU":
        return "Neurologie";
      case "PED":
        return "Pediatrie";
      case "CRD":
        return "Cardiologie";
      case "GIN":
        return "Ginecologie";
      default:
        return "N/A";
    }
  };

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    navigate("/login");
  };

  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [results, setResults] = useState<Office[]>([]);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    try {
      console.log("handleSearch triggered");
      const response = await axios.get("http://localhost:5000/fetchOffices", {
        params: {
          q: query,
          judet: judet || undefined,
          spec: spec || undefined,
        },
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handleResetFilters = () => {
    setJudet("");
    setSpec("");
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img
            src="src/assets/Minerva2.png"
            alt="Company Logo"
            className="logo"
          />
        </div>
        <div className="header-center">
          <Button
            width="80px"
            variant="filled-alt"
            onClick={() => navigate("/main2")}
            color="blue"
            selected={location.pathname === "/tconfirmation"}
          >
            Home
          </Button>
          <Button
            variant="filled-alt"
            onClick={() => navigate("/appointments_reg")}
            color="blue"
          >
            Appointments
          </Button>
          <Button
            width="80px"
            variant="filled-alt"
            onClick={() => navigate("/rsplitchats")}
            color="blue"
          >
            Chat
          </Button>
          <Button
            width="80px"
            variant="filled-alt"
            selected={location.pathname === "/search"}
            onClick={() => navigate("/search")}
            color="blue"
          >
            Search
          </Button>
        </div>
        <div className="header-right">
          <Button
            width="80px"
            variant="filled-alt"
            onClick={handleLogout}
            color="blue"
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="search-section">
        <div className="search-container">
          <div className="search-wrapper">
            <div className="search-bar">
              <TextBox
                value={query}
                onChange={setQuery}
                placeholder="Search"
                className="form-control search-input"
              />
              <Button
                onClick={handleSearch}
                color="primary"
                variant="regular"
                className="search-button"
                icon="src/assets/search.png"
              />
            </div>

            <div className="filters-toggle">
              <Button
                width="100px"
                color="gray"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="filters-button"
              >
                Filtre
              </Button>

              {/* ⬇️ Pop-out panel */}
              {filtersOpen && (
                <div className="filters-panel">
                  <SpecPicker value={spec} onOptionSelect={setSpec} />
                  <JudetPicker value={judet} onOptionSelect={setJudet} />
                  <Button
                    width="160px"
                    onClick={handleResetFilters}
                    color="secondary"
                  >
                    Resetare Filtre
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="results-container">
        {Array.isArray(results) && results.length > 0 ? (
          <div className="result-grid">
            {results.map((office) => (
              <div key={office.office_id} className="result-card">
                {/* ───────── Avatar + existing content side-by-side ───────── */}
                <div className="card-row">
                  {/* avatar on the left */}
                  <img
                    src={
                      office.profile_picture
                        ? `http://localhost:5000/uploads/${office.profile_picture}`
                        : "src/assets/placeholder.png"
                    }
                    alt="Doctor"
                    className="result-avatar"
                  />

                  {/* all previous content untouched, wrapped for layout */}
                  <div className="card-content" style={{ flex: 1 }}>
                    <div className="result-header">
                      <div className="office-name">
                        Dr. {office.doctor_nume} {office.doctor_prenume}
                      </div>
                      <span className="office-id">{office.office_nume}</span>
                    </div>

                    <div className="office-location">
                      {getSpecLabel((office.doctor_spec || "").toUpperCase())} –
                      {office.doctor_bio}
                    </div>

                    <hr className="result-divider" />

                    <div className="result-footer">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div className="office-location">
                          {office.adresa}, {office.oras}, {office.judet}
                        </div>
                        <Button
                          width="80px"
                          onClick={() =>
                            navigate(`/doctor-about/${office.doctor_id}`)
                          }
                          color="blue"
                        >
                          Detalii
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">Niciun rezultat găsit.</p>
        )}
      </div>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <h4>About Us</h4>
            <p>
              MinervaMed is a modern healthcare platform that connects patients
              and doctors with ease. We strive to simplify medical appointments,
              communication, and care.
            </p>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <p>📞 Phone: +40 123 456 789</p>
            <p>📧 Email: contact@minervamed.ro</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default SearchPageTest;
