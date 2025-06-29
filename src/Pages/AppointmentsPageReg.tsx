import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";

interface Appointment {
  app_id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  name: string;
  description: string;
  category: string;
  docName: string;
}

const PatientAppointmentsPage = () => {
  const specOptions = [
    { code: "KIN", label: "Physiotherapy" },
    { code: "DEN", label: "Dental Medicine" },
    { code: "FAM", label: "Family Medicine" },
    { code: "DRM", label: "Dermatology" },
    { code: "OFT", label: "Ophthalmology" },
    { code: "ORL", label: "ENT" },
    { code: "PSI", label: "Psychology" },
    { code: "NEU", label: "Neurology" },
    { code: "PED", label: "Pediatrics" },
    { code: "CRD", label: "Cardiology" },
    { code: "GIN", label: "Gynecology" },
  ];

  const specLabels: Record<string, string> = {
    KIN: "Physiotherapy",
    DEN: "Dental Medicine",
    FAM: "Family Medicine",
    DRM: "Dermatology",
    OFT: "Ophthalmology",
    ORL: "ENT",
    PSI: "Psychology",
    NEU: "Neurology",
    PED: "Pediatrics",
    CRD: "Cardiology",
    GIN: "Gynecology",
  };

  const navigate = useNavigate();
  const location = useLocation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedAppointmentIds, setExpandedAppointmentIds] = useState<
    Set<string>
  >(new Set());

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const handleConfirm = async (appId: string) => {
    try {
      await axios.post(
        "http://localhost:5000/confirmAppointment",
        { appId },
        { withCredentials: true }
      );

      alert("✅ Appointment confirmed!");

      setAppointments((prev) =>
        prev.map((app) =>
          app.app_id === appId ? { ...app, status: "confirmed" } : app
        )
      );
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  const getMonthKey = (dateStr: string): string => {
    const [year, month] = dateStr.split("-");
    return `${year}-${month}`;
  };

  const getMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/fetchAppointmentsReg", {
        withCredentials: true,
      })
      .then((response) => {
        setAppointments(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      });
  }, []);

  const completedAppointments = appointments.filter(
    (a) => a.status === "completed"
  );

  const groupedByMonth = completedAppointments.reduce((acc, app) => {
    const key = getMonthKey(app.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const filteredAppointments = appointments.filter(
    (appointment) =>
      (showCompleted
        ? appointment.status === "completed"
        : appointment.status !== "completed") &&
      (!selectedType || appointment.category === selectedType)
  );

  const toggleMonthCard = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      next.has(monthKey) ? next.delete(monthKey) : next.add(monthKey);
      return next;
    });
  };

  const toggleCard = (appId: string) => {
    setExpandedAppointmentIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(appId) ? newSet.delete(appId) : newSet.add(appId);
      return newSet;
    });
  };

  if (loading) return <div>Loading appointments...</div>;

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
              onClick={() => navigate("/login")}
              color="blue"
              selected={location.pathname === "/appointments_reg"}
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
              width="110px"
              variant="filled-alt"
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

        <div className="doc-appointments-page">
          <div className="doc-appointments-layout">
            <section className="doc-appointments-container">
              <h2>Programări</h2>

              <div className="doc-appointments-controls">
                <select
                  className="doc-appointments-select"
                  value={selectedType ?? ""}
                  onChange={(e) =>
                    setSelectedType(
                      e.target.value === "" ? null : e.target.value
                    )
                  }
                >
                  <option value="">Toate Tipurile</option>
                  {specOptions.map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowCompleted((prev) => !prev)}
                  className={`doc-appointments-toggle-button ${
                    showCompleted ? "completed" : ""
                  }`}
                >
                  {showCompleted
                    ? "Show Pending / Confirmed"
                    : "Show Completed"}
                </button>
              </div>

              {filteredAppointments.length === 0 ? (
                <p>No matching appointments found.</p>
              ) : showCompleted ? (
                Object.entries(groupedByMonth).map(([monthKey, monthApps]) => {
                  const isMonthExpanded = expandedMonths.has(monthKey);
                  return (
                    <div
                      key={monthKey}
                      className={`doc-appointments-month-card ${
                        isMonthExpanded ? "expanded" : "collapsed"
                      }`}
                      onClick={() => toggleMonthCard(monthKey)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="doc-appointments-card-top">
                        <div className="doc-appointments-title">
                          {getMonthLabel(monthKey)}
                        </div>
                        <div className="doc-appointments-expand-icon">
                          {isMonthExpanded ? "▲" : "▼"}
                        </div>
                      </div>

                      {isMonthExpanded && (
                        <div style={{ marginTop: 12 }}>
                          {monthApps.map((appointment) => {
                            const isExpanded = expandedAppointmentIds.has(
                              appointment.app_id
                            );
                            return (
                              <div
                                key={appointment.app_id}
                                className={`doc-appointments-card ${
                                  isExpanded ? "expanded" : "collapsed"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCard(appointment.app_id);
                                }}
                                style={{ marginTop: 12 }}
                              >
                                <div className="doc-appointments-card-top">
                                  <div className="doc-appointments-card-left">
                                    <div className="doc-appointments-title">
                                      {appointment.date}
                                    </div>
                                    <div className="doc-appointments-info-row">
                                      <span>
                                        <strong>Ora:</strong>{" "}
                                        {appointment.startTime} –{" "}
                                        {appointment.endTime}
                                      </span>
                                      <span>
                                        <strong>Tipul:</strong>{" "}
                                        {specLabels[appointment.category] ||
                                          appointment.category}
                                      </span>
                                      <span>
                                        <strong>Doctor:</strong> Dr.{" "}
                                        {appointment.docName}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="doc-appointments-expand-icon">
                                    {isExpanded ? "▲" : "▼"}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="doc-appointments-card-details">
                                    {appointment.description && (
                                      <>
                                        <label>
                                          <strong>Description:</strong>
                                        </label>
                                        <textarea
                                          value={appointment.description}
                                          readOnly
                                          className="doc-appointments-description transparent"
                                          rows={4}
                                        />
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.app_id}
                    className="doc-appointments-card expanded"
                  >
                    <div className="doc-appointments-card-top">
                      <div className="doc-appointments-card-left">
                        <div className="doc-appointments-title">
                          {appointment.date}
                        </div>
                        <div className="doc-appointments-info-row">
                          <span>
                            <strong>Ora:</strong> {appointment.startTime} –{" "}
                            {appointment.endTime}
                          </span>
                          <span>
                            <span>
                              <strong>Tipul:</strong>{" "}
                              {specLabels[appointment.category] ||
                                appointment.category}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="doc-appointments-card-details">
                      <p>
                        <strong>Statut:</strong>{" "}
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </p>
                      <p>
                        <strong>Doctor:</strong> Dr. {appointment.docName}
                      </p>
                      {appointment.status === "pending" && (
                        <button
                          className="doc-appointments-complete-button"
                          onClick={() => handleConfirm(appointment.app_id)}
                        >
                          Confirmare Programare
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
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
};

export default PatientAppointmentsPage;
