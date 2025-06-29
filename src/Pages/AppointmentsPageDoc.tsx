import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/Button";
import { StreamChat } from "stream-chat";

interface Appointment {
  app_id: string;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  description: string;
  status: string;
}

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    localStorage.removeItem("userRole");
    navigate("/login");
  };
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>(
    {}
  );

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [modalDescription, setModalDescription] = useState("");
  const [modalAppId, setModalAppId] = useState<string | null>(null);

  const completedAppointments = appointments.filter(
    (app) => app.status === "completed"
  );

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonthCard = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      next.has(monthKey) ? next.delete(monthKey) : next.add(monthKey);
      return next;
    });
  };

  const getMonthLabel = (key: string) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const groupedByMonth = completedAppointments.reduce((acc, app) => {
    const date = new Date(app.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const openCompleteModal = (appId: string) => {
    setModalAppId(appId);
    setModalDescription("");
    setCompleteModalOpen(true);
  };

  const confirmComplete = () => {
    if (modalAppId && modalDescription.trim()) {
      handleMarkCompleted(modalAppId, modalDescription.trim());
      setCompleteModalOpen(false);
    } else {
      alert("Please enter a description.");
    }
  };

  const [expandedAppointmentIds, setExpandedAppointmentIds] = useState<
    Set<string>
  >(new Set());

  const toggleCard = (id: string) => {
    setExpandedAppointmentIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    axios
      .get("http://localhost:5000/fetchAppointments", { withCredentials: true })
      .then((response) => {
        setAppointments(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setLoading(false);
      });
  }, []);

  const handleMarkCompleted = async (appId: string, description: string) => {
    if (!description || description.trim() === "") {
      alert("Description cannot be empty.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/complete-appointment",
        { appointmentId: appId, description: description.trim() },
        { withCredentials: true }
      );

      alert(" Appointment marked as completed!");

      setAppointments((prev) =>
        prev.map((app) =>
          app.app_id === appId
            ? { ...app, status: "completed", description: description.trim() }
            : app
        )
      );
    } catch (error) {
      console.error("Error completing appointment:", error);
    }
  };

  const toggleDateGroup = (date: string) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const filteredAppointments = appointments.filter((appointment) =>
    showCompleted
      ? appointment.status === "completed"
      : appointment.status !== "completed"
  );

  const groupedByDate = filteredAppointments.reduce((acc, appointment) => {
    if (!acc[appointment.date]) acc[appointment.date] = [];
    acc[appointment.date].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

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
            >
              Home
            </Button>
            <Button
              color="blue"
              variant="filled-alt"
              onClick={() => navigate("/appointments_doc")}
              selected={location.pathname === "/appointments_doc"}
            >
              Appointments
            </Button>
            <Button
              width="80px"
              color="blue"
              variant="filled-alt"
              onClick={() => navigate("/splitchats")}
            >
              Chat
            </Button>
            <Button
              width="110px"
              color="blue"
              variant="filled-alt"
              onClick={() => navigate("/testscheduler")}
            >
              Scheduler
            </Button>
          </div>

          <div className="header-right">
            <button
              className="round-button"
              onClick={() => navigate("/about")}
              title="Profile"
            >
              <img
                src="src/assets/user.png"
                alt=""
                className="round-button-icon"
              />
            </button>

            <Button
              color="blue"
              variant="filled-alt"
              width="80px"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </header>

        <div className="doc-appointments-page">
          <div className="doc-appointments-container">
            <h2>Programări</h2>

            <div className="doc-appointments-toggle-wrapper">
              <button
                onClick={() => setShowCompleted((prev) => !prev)}
                className={`doc-appointments-toggle-button ${
                  showCompleted ? "completed" : ""
                }`}
              >
                {showCompleted ? "Show Pending / Confirmed" : "Show Completed"}
              </button>
            </div>

            {showCompleted ? (
              completedAppointments.length === 0 ? (
                <p>No completed appointments.</p>
              ) : (
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
                        <div style={{ marginTop: "12px" }}>
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
                                style={{ cursor: "pointer", marginTop: "12px" }}
                              >
                                <div className="doc-appointments-card-top">
                                  <div className="doc-appointments-card-left">
                                    <div className="doc-appointments-title">
                                      {appointment.name}
                                    </div>
                                    <div className="doc-appointments-info-row">
                                      <span>{appointment.date}</span>
                                      <span>
                                        {appointment.startTime} -{" "}
                                        {appointment.endTime}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="doc-appointments-expand-icon">
                                    {isExpanded ? "▲" : "▼"}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="doc-appointments-card-details">
                                    <p>
                                      <strong>Status:</strong>{" "}
                                      {appointment.status}
                                    </p>

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
              )
            ) : filteredAppointments.length === 0 ? (
              <p>No pending or confirmed appointments.</p>
            ) : (
              filteredAppointments.map((appointment) => {
                const isExpanded = expandedAppointmentIds.has(
                  appointment.app_id
                );

                return (
                  <div
                    key={appointment.app_id}
                    className={`doc-appointments-card ${
                      isExpanded ? "expanded" : "collapsed"
                    }`}
                    onClick={() => toggleCard(appointment.app_id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="doc-appointments-card-top">
                      <div className="doc-appointments-card-left">
                        <div className="doc-appointments-title">
                          {appointment.name}
                        </div>
                        <div className="doc-appointments-info-row">
                          <span>{appointment.date}</span>
                          <span>
                            {appointment.startTime} - {appointment.endTime}
                          </span>
                        </div>
                      </div>
                      <div className="doc-appointments-expand-icon">
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="doc-appointments-card-details">
                        <p>
                          <strong>Status:</strong>{" "}
                          {appointment.status.charAt(0).toUpperCase() +
                            appointment.status.slice(1)}
                        </p>

                        <button
                          className="doc-appointments-complete-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCompleteModal(appointment.app_id);
                          }}
                        >
                          Mark as Completed
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {completeModalOpen && (
            <div className="doc-modal-overlay">
              <div className="doc-modal-container">
                <h2 className="doc-modal-title">
                  Mark Appointment as Completed
                </h2>

                <label className="doc-modal-label">
                  Closing Notes - Visible By The Patient
                </label>

                <textarea
                  className="doc-modal-textarea"
                  rows={6}
                  value={modalDescription}
                  placeholder="Write a short summary of the appointment..."
                  onChange={(e) => setModalDescription(e.target.value)}
                />

                <div className="doc-modal-footer">
                  <Button
                    color="blue"
                    width="160px"
                    onClick={() => setCompleteModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button color="blue" width="160px" onClick={confirmComplete}>
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
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
              <p> Phone: +40 123 456 789</p>
              <p> Email: contact@minervamed.ro</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default AppointmentsPage;
