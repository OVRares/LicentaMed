// Refactored Appointment Grid with real CSS Grid
import React, { useState, useEffect, useRef } from "react";
import {
  format,
  parse,
  addMinutes,
  differenceInMinutes,
  startOfMonth,
  startOfWeek,
  addWeeks,
  addDays,
} from "date-fns";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { StreamChat } from "stream-chat";
import { response } from "express";
import Button from "../components/Button";

// Types
interface Appointment {
  app_id: string; // e.g. "Consultation"
  date: string; // e.g. "2025-05-01"
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  name: string;
  description: string;
  status?: string; // Optional status field
}

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();
const currentMonth = new Date(); // June, if today is June

const AppointmentGridModal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patient_Id = location.state?.patientId || null;
  const channelId = location.state?.channelId;

  const [patientName, setPatientName] = useState<string | null>(null);

  const [editableDescription, setEditableDescription] = useState("");
  const [deleteEnabled, setDeleteEnabled] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const didCallEndpoint = useRef(false);

  const [channel, setChannel] = useState<any>(null);
  const [client, setClient] = useState<StreamChat | null>(null);

  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalTime, setModalTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    duration: "30",
    description: "",
  });

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    navigate("/login");
    client?.disconnectUser;
  };

  useEffect(() => {
    if (selectedAppointment) {
      setEditableDescription(selectedAppointment.description || "");
    }
  }, [selectedAppointment]);

  const handleUpdateDescription = async () => {
    if (!selectedAppointment) return;

    try {
      // 1️⃣  Update backend (still send "notes", because that’s what the API expects)
      await axios.post(
        "http://localhost:5000/updateAppointment",
        {
          appId: selectedAppointment.app_id,
          notes: editableDescription, // backend param
        },
        { withCredentials: true }
      );

      // 2️⃣  Patch the master list so every grid/list view has the new description
      setAppointments((prev) =>
        prev.map((a) =>
          a.app_id === selectedAppointment.app_id
            ? { ...a, description: editableDescription } // <- correct field
            : a
        )
      );

      // 3️⃣  Patch the modal copy so the textarea keeps the new value
      setSelectedAppointment((prev) =>
        prev ? { ...prev, description: editableDescription } : prev
      );

      // (optional) close the modal or show a toast:
      // setShowDeleteModal(false);
    } catch (err) {
      console.error("❌ Failed to update description:", err);
      alert("Could not save notes.");
    }
  };

  useEffect(() => {
    if (didCallEndpoint.current) return;
    didCallEndpoint.current = true;

    axios
      .get("http://localhost:5000/session", { withCredentials: true })
      .then((response) => {
        setUser(response.data.user);
      })
      .catch((err) => {
        console.error("Error fetching session data:", err);
        setUser(null);
        setError("Failed to retrieve session info. Please log in again.");
      });
  }, []);

  useEffect(() => {
    const setupStreamClient = async () => {
      if (!user) return;

      const chatClient = StreamChat.getInstance("vs9hb5583yhf");

      if (!chatClient.userID) {
        try {
          const tokenRes = await axios.get(
            "http://localhost:5000/api/chat/stream-token",

            {
              withCredentials: true,
            }
          );

          const token = tokenRes.data.token;
          if (!token) {
            console.error(" No token received");
            return;
          }

          await chatClient.connectUser(
            {
              id: user.uid,
              name: user.name || "Unnamed",
              email: user.email || "",
            },
            token
          );

          console.log(" Stream user connected:", user.uid);

          setClient(chatClient);
        } catch (err) {
          console.error(" Error connecting Stream client:", err);
        }
      } else {
        console.log(" Stream client already connected");
        setClient(chatClient);
      }
    };

    setupStreamClient();
  }, [user]);

  useEffect(() => {
    const connectChannel = async () => {
      if (!client || !channelId) return;

      try {
        const activeChannel = client.channel("messaging", channelId);
        await activeChannel.watch();
        setChannel(activeChannel);
        console.log(" Channel connected");
      } catch (err) {
        console.error(" Error connecting to channel:", err);
      }
    };

    connectChannel();
  }, [client, channelId]);

  useEffect(() => {
    if (!user) return;

    axios
      .get("http://localhost:5000/fetchAppointments", { withCredentials: true })
      .then((response) => {
        console.log("Fetched appointments:", response.data);
        setAppointments(
          (response.data as Appointment[]).filter(
            (a) =>
              !["completed", "canceled"].includes(
                (a.status || "").toLowerCase()
              )
          )
        );
      })
      .catch((err) => {
        console.error(" Failed to load appointments:", err);
      });
  }, [user]);

  useEffect(() => {
    const fetchPatientName = async () => {
      if (!patient_Id) return; // no need to fetch if not linked to chat

      try {
        const response = await axios.get("http://localhost:5000/patientName", {
          params: { patientId: patient_Id },
          withCredentials: true,
        });

        setPatientName(response.data.fullName);
      } catch {
        // No need to set an error – silently continue
      }
    };

    fetchPatientName();
  }, [patient_Id]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekIndex, setWeekIndex] = useState(0);
  const [allowedDurations, setAllowedDurations] = useState<number[]>([]);

  const getWeekDates = (weekOffset: number) => {
    const monthStart = startOfMonth(currentMonth);
    const weekStart = addWeeks(
      startOfWeek(monthStart, { weekStartsOn: 1 }),
      weekOffset
    );
    return Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  };

  const currentWeekDates = getWeekDates(weekIndex);

  const handleSlotClick = (date: Date, time: string) => {
    const dateString = format(date, "yyyy-MM-dd");
    const slotTime = parse(time, "HH:mm", new Date());

    // 🔍 Is there already an appointment that covers this slot?
    const existing = appointments.find((a) => {
      if (a.date !== dateString) return false;
      const start = parse(a.startTime, "HH:mm", new Date());
      const end = parse(a.endTime, "HH:mm", new Date());
      return slotTime >= start && slotTime < end;
    });

    if (existing) {
      // open the edit / delete modal instead
      setSelectedAppointment(existing);
      setSelectedCell({ date: existing.date, time: existing.startTime });
      setShowDeleteModal(true);
      return;
    }

    /* ------------------------------------------------------------------
     NEW: build a list of durations that don’t collide with other
     appointments on the same day.
  ------------------------------------------------------------------ */

    const selectedSlotIndex = timeSlots.indexOf(time); // index in 30-min array
    const durations: number[] = []; // will hold 30 / 60 / 90 / 120

    const dateAppointments = appointments.filter((a) => a.date === dateString);

    const isSlotFree = (startIdx: number, blockCount: number): boolean => {
      for (let i = 0; i < blockCount; i++) {
        const slotLabel = timeSlots[startIdx + i]; // e.g. "14:30"
        const slotStart = parse(slotLabel, "HH:mm", new Date());

        const overlaps = dateAppointments.some((a) => {
          const aStart = parse(a.startTime, "HH:mm", new Date());
          const aEnd = parse(a.endTime, "HH:mm", new Date());
          return slotStart >= aStart && slotStart < aEnd;
        });

        if (overlaps) return false; // a conflicting booking found
      }
      return true;
    };

    for (const duration of [30, 60, 90, 120]) {
      const blocksNeeded = duration / 30;
      const fitsInDay = selectedSlotIndex + blocksNeeded <= timeSlots.length;
      if (fitsInDay && isSlotFree(selectedSlotIndex, blocksNeeded)) {
        durations.push(duration);
      }
    }

    /* ------------------------------------------------------------------ */

    // ⬇ open the “New Appointment” modal, passing the allowed durations
    setAllowedDurations(durations); // ← state you already created
    setSelectedCell({ date: dateString, time });
    setModalDate(date);
    setModalTime(time);
    setFormData({
      name: "",
      duration: String(durations[0] || 30), // default to first valid (or 30)
      description: "",
    });
    setModalOpen(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await axios.post(
        "http://localhost:5000/cancelAppointment",
        {
          appId: selectedAppointment.app_id,
        },
        { withCredentials: true }
      );

      setAppointments((prev) =>
        prev.filter((a) => a.app_id !== selectedAppointment.app_id)
      );
    } catch (err) {
      console.error("❌ Failed to delete from DB:", err);
      alert("Could not delete appointment.");
    }

    setShowDeleteModal(false);
    setSelectedAppointment(null);
    setSelectedCell(null); // ✅
  };

  const handleCreateAppointment = () => {
    if (!modalDate || !modalTime) return;

    const dateString = format(modalDate, "yyyy-MM-dd");
    const slotTime = parse(modalTime, "HH:mm", new Date());
    const selectedSlotIndex = timeSlots.indexOf(modalTime); // e.g. "15:00"
    const maxAvailableSlots = timeSlots.length - selectedSlotIndex;
    const requestedSlots = parseInt(formData.duration, 10) / 30;

    // Clamp to max remaining slots
    const actualSlots = Math.min(requestedSlots, maxAvailableSlots);
    const actualDuration = actualSlots * 30;

    const endTime = format(addMinutes(slotTime, actualDuration), "HH:mm");

    const newAppointment = {
      date: dateString,
      startTime: modalTime,
      endTime,
      name: formData.name.trim(),
      description: formData.description.trim(),
    };

    axios
      .post(
        "http://localhost:5000/appointments",
        {
          date: newAppointment.date,
          t_start: newAppointment.startTime,
          t_stop: newAppointment.endTime,
          patientId: patient_Id,
          notes: newAppointment.description,
          name: newAppointment.name,
        },
        { withCredentials: true }
      )
      .then((response) => {
        const { appId } = response.data;
        if (!appId) {
          console.error("❌ No appId returned from backend!");
          return;
        }

        if (channel) {
          channel.sendMessage({
            text: "",
            customType: "appointmentRequest",
            customData: {
              appId,
              label: `Confirm Appointment: ${newAppointment.date} at ${newAppointment.startTime}`,
              status: "pending",
            },
          } as any);
        }

        setAppointments((prev) => [
          ...prev,
          {
            ...newAppointment,
            app_id: appId, // ✅ Include the ID returned from the backend
          },
        ]);
        setModalOpen(false);
        setSelectedCell(null);
      })
      .catch((err) => {
        console.error("❌ Failed to save appointment:", err);
      });
  };

  const weekStartDate = currentWeekDates[0];
  const weekEndDate = currentWeekDates[currentWeekDates.length - 1];

  const filteredAppointments = appointments.filter((app) => {
    const appDate = parse(app.date, "yyyy-MM-dd", new Date());
    return appDate >= weekStartDate && appDate <= weekEndDate;
  });

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
            >
              Appointments
            </Button>
            <Button
              width="80px"
              color="blue"
              variant="filled-alt"
              onClick={() => navigate("/splitchats")}
              selected={location.pathname === "/splitchats"}
            >
              Chat
            </Button>
            <Button
              width="110px"
              color="blue"
              variant="filled-alt"
              onClick={() => navigate("/testscheduler")}
              selected={location.pathname === "/testscheduler"}
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

        <div className="layout-container">
          {/* Left Column */}
          <div className="left-column">
            {/* Appointment List */}
            <div className="appointment-list">
              <h3 style={{ marginTop: 0 }}>Programările Săptămânii</h3>

              {filteredAppointments.length === 0 ? (
                <p className="text-gray-400 italic">No appointments</p>
              ) : (
                filteredAppointments.map((app) => (
                  <div
                    key={app.app_id}
                    className={`appointment-card ${
                      selectedAppointment?.app_id === app.app_id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedAppointment(app);
                      setSelectedCell({ date: app.date, time: app.startTime });
                    }}
                    style={{
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                        {app.name}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {app.date}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {app.startTime} - {app.endTime}
                      </div>
                    </div>

                    <button
                      className="edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(app);
                        setEditableDescription(app.description || "");
                        setDeleteEnabled(false);
                        setShowDeleteModal(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="right-column">
            <div className="top-bar-container">
              <div className="mode-inline-box">
                <p>
                  {patientName ? (
                    <>
                      Programare pentru <strong>{patientName}</strong>
                    </>
                  ) : patient_Id ? (
                    <>
                      Programare pentru <strong>{patient_Id}</strong>
                    </>
                  ) : (
                    <>Programare Generală</>
                  )}
                </p>
              </div>

              <div className="week-selector">
                <Button
                  color="blue"
                  width="140px"
                  onClick={() => setWeekIndex(weekIndex - 1)}
                  disabled={weekIndex === 0}
                >
                  ← Prev Week
                </Button>

                <div className="week-label">
                  Week {weekIndex + 1} of May 2025
                </div>

                <Button
                  color="blue"
                  width="140px"
                  onClick={() => setWeekIndex(weekIndex + 1)}
                  disabled={weekIndex === 3}
                >
                  Next Week →
                </Button>
              </div>
            </div>

            <div className="calendar-grid">
              {/* Header Row */}
              <div className="grid-time-col" />
              {currentWeekDates.map((date) => (
                <div key={date.toISOString()} className="grid-day-header">
                  {format(date, "EEE MMM d")}
                </div>
              ))}

              {/* Time slots */}
              {timeSlots.map((slot) => (
                <React.Fragment key={slot}>
                  {/* Time column cell */}
                  <div className="grid-time-col">
                    {(() => {
                      const slotStart = parse(slot, "HH:mm", new Date());
                      const slotEnd = format(
                        addMinutes(slotStart, 30),
                        "HH:mm"
                      );
                      return `${slot} - ${slotEnd}`;
                    })()}
                  </div>

                  {/* Day columns */}
                  {currentWeekDates.map((date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const slotTime = parse(slot, "HH:mm", new Date());

                    // Check if there's an appointment at this slot
                    const appointment = appointments.find((a) => {
                      if (a.date !== dateStr) return false;
                      const start = parse(a.startTime, "HH:mm", new Date());
                      const end = parse(a.endTime, "HH:mm", new Date());
                      return slotTime >= start && slotTime < end;
                    });

                    const isStartBlock = appointment?.startTime === slot;
                    const isSelectedBlock =
                      selectedAppointment?.app_id === appointment?.app_id &&
                      isStartBlock;

                    const duration = appointment
                      ? differenceInMinutes(
                          parse(appointment.endTime, "HH:mm", new Date()),
                          parse(appointment.startTime, "HH:mm", new Date())
                        )
                      : 0;

                    const rowSpan = duration / 30;

                    // ⛔️ Skip rendering non-start appointment slots
                    if (appointment && !isStartBlock) return null;

                    // ✅ Render the cell
                    return (
                      <div
                        key={`${dateStr}-${slot}`}
                        className={`grid-cell ${
                          appointment ? "selected" : ""
                        } ${isSelectedBlock ? "highlight" : ""}`}
                        style={
                          isStartBlock ? { gridRow: `span ${rowSpan}` } : {}
                        }
                        onClick={() => handleSlotClick(date, slot)}
                      >
                        <div className="appointment-title">
                          {isStartBlock ? appointment.name : ""}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {modalOpen && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.25)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "32px",
                  borderRadius: "12px",
                  width: "600px", // ✅ wider modal
                  maxWidth: "90vw",
                  fontSize: "18px", // ✅ larger base text
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <h2 style={{ margin: 0 }}>New Appointment</h2>

                <div>
                  <strong>Title:</strong>
                  <input
                    style={{
                      marginTop: "8px",
                      padding: "10px",
                      fontSize: "16px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                    placeholder="Appointment title"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <strong>
                    Starting Hour –{" "}
                    <span style={{ fontWeight: 500 }}>{modalTime}</span> →
                    Duration:
                  </strong>

                  <select
                    style={{
                      marginTop: "8px",
                      padding: "10px",
                      fontSize: "16px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    disabled={allowedDurations.length <= 1}
                  >
                    {allowedDurations.map((d) => (
                      <option key={d} value={d}>
                        {d} minutes
                      </option>
                    ))}
                  </select>

                  {allowedDurations.length === 0 && (
                    <p style={{ color: "red", marginTop: "6px" }}>
                      No available duration at this time.
                    </p>
                  )}
                </div>

                <div>
                  <strong>Description:</strong>
                  <textarea
                    style={{
                      marginTop: "8px",
                      padding: "10px",
                      fontSize: "16px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                    placeholder="Optional description"
                    value={formData.description}
                    rows={4}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                  }}
                >
                  <Button
                    onClick={() => setModalOpen(false)}
                    variant="filled"
                    color="gray"
                    width="140px"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAppointment}
                    color="primary"
                    width="140px"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal && selectedAppointment && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.25)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "32px",
                  borderRadius: "12px",
                  width: "100%",
                  maxWidth: "600px", // ⬅ wider
                  fontSize: "18px", // ⬅ larger text
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <h2 style={{ margin: 0 }}>Edit Appointment</h2>

                {selectedAppointment.name && (
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "20px",
                      marginTop: "4px",
                      color: "#333",
                    }}
                  >
                    {selectedAppointment.name}
                  </div>
                )}

                <div>
                  <strong>Data:</strong> {selectedAppointment.date}
                </div>

                <div>
                  <strong>Ora:</strong> {selectedAppointment.startTime} -{" "}
                  {selectedAppointment.endTime}
                </div>

                <div>
                  <strong>Description:</strong>
                  <textarea
                    style={{
                      marginTop: "8px",
                      padding: "10px",
                      fontSize: "16px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      width: "100%",
                    }}
                    rows={4}
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                  />
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span style={{ fontSize: "16px" }}>Anulare Programare?</span>

                  {/* custom toggle */}
                  <label
                    style={{
                      position: "relative",
                      width: "46px",
                      height: "24px",
                      display: "inline-block",
                      cursor: "pointer",
                    }}
                  >
                    {/* hidden checkbox keeps the state */}
                    <input
                      type="checkbox"
                      checked={deleteEnabled}
                      onChange={(e) => setDeleteEnabled(e.target.checked)}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0,
                      }}
                    />

                    {/* track */}
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: deleteEnabled ? "#3C39B2" : "#ccc",
                        borderRadius: "34px",
                        transition: "background-color 0.2s",
                      }}
                    />

                    {/* thumb */}
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: deleteEnabled ? "24px" : "4px",
                        width: "18px",
                        height: "18px",
                        backgroundColor: "#fff",
                        borderRadius: "50%",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    />
                  </label>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginTop: "24px",
                  }}
                >
                  {/* Left side: Delete */}
                  <Button
                    onClick={handleCancelAppointment}
                    color="blue"
                    variant="filled-alt"
                    selected={true}
                    disabled={!deleteEnabled}
                  >
                    Cancel Appointment
                  </Button>

                  {/* Right side: Cancel + Save */}
                  <div style={{ display: "flex", gap: "12px" }}>
                    <Button
                      onClick={() => setShowDeleteModal(false)}
                      color="gray"
                      variant="filled"
                      width="140px"
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={() => {
                        handleUpdateDescription();
                        setShowDeleteModal(false); // ✅ Auto-close modal
                      }}
                      color="blue"
                      width="140px"
                    >
                      Save Changes
                    </Button>
                  </div>
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
              <p>📞 Phone: +40 123 456 789</p>
              <p>📧 Email: contact@minervamed.ro</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default AppointmentGridModal;
