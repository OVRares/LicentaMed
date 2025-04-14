import React, { useState } from "react";
import TextBox from "../components/TextBox";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FilterPanel from "../components/FilterPanel";

function SearchPageTest() {
  const [judet, setJudet] = useState("");
  const [spec, setSpec] = useState("");

  interface Office {
    office_id: number;
    office_nume: string;
    oras: string;
    judet: string;
    adresa: string;
    tel: string;
    spec: string;
    doctor_nume: string;
    doctor_prenume: string;
  }

  const getSpecLabel = (code: string): string => {
    switch (code) {
      case "KIN":
        return "Kinetoterapie";
      case "FAM":
        return "Medicină de familie";
      case "DEN":
        return "Medicină dentară";
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
          <Button onClick={() => navigate("/profile")} color="blue">
            Profilul Meu
          </Button>
        </div>
        <div className="header-right">
          <Button onClick={handleLogout} color="blue">
            Logout
          </Button>
        </div>
      </header>

      <div className="search-section mt-4">
        <div className="search-container">
          <TextBox
            value={query}
            onChange={setQuery}
            placeholder="Cautare"
            className="form-control search-input"
          />

          <Button
            onClick={() => handleSearch()}
            color="primary"
            variant="regular"
            className="search-button"
            icon="src/assets/search.png"
          ></Button>
        </div>
      </div>
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-3">
            <div className="filter-panel">
              <FilterPanel
                judet={judet}
                spec={spec}
                onJudetChange={setJudet}
                onSpecialtyChange={setSpec}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
          <div className="col-md-9">
            <div className="results-container">
              {Array.isArray(results) && results.length > 0 ? (
                <ul className="list-unstyled">
                  {results.map((office) => (
                    <li key={office.office_id} className="result-item">
                      <div className="result-header">
                        <div className="office-name">{office.office_nume}</div>
                        <span className="office-id">#{office.office_id}</span>
                      </div>

                      <div className="office-location">
                        {office.oras}, {office.judet}
                      </div>

                      <hr className="result-divider" />

                      <div className="result-footer">
                        <div className="office-tel">
                          Adresa: {office.adresa}
                        </div>
                        <div className="office-tel">Tel: {office.tel}</div>
                        <div className="office-spec">
                          Spec: {getSpecLabel(office.spec)}
                        </div>
                        <div className="office-doctor">
                          Doctor: {office.doctor_prenume} {office.doctor_nume}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">Niciun rezultat găsit.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SearchPageTest;
