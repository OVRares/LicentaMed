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
import { useLocation } from "react-router-dom";
import { StreamChat } from "stream-chat";
import { response } from "express";

// Types
interface Appointment {
  date: string; // e.g. "2025-05-01"
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  name: string;
  description: string;
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
const currentMonth = new Date(2025, 4); // May 2025

const AppointmentGrid = () => {
  const location = useLocation();
  const patient_Id = location.state?.patientId || null;
  const channelId = location.state?.channelId;

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const didCallEndpoint = useRef(false);

  const [channel, setChannel] = useState<any>(null);
  const [client, setClient] = useState<StreamChat | null>(null);

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
      if (!user) return; // ✅ wait until user is available

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
            console.error("❌ No token received");
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

          console.log("✅ Stream user connected:", user.uid);

          setClient(chatClient);
        } catch (err) {
          console.error("❌ Error connecting Stream client:", err);
        }
      } else {
        console.log("✅ Stream client already connected");
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
        console.log("✅ Channel connected");
      } catch (err) {
        console.error("❌ Error connecting to channel:", err);
      }
    };

    connectChannel();
  }, [client, channelId]);

  useEffect(() => {
    if (!user) return;

    axios
      .get("http://localhost:5000/fetchAppointments", { withCredentials: true })
      .then((response) => {
        console.log("Fetched appointments:", response.data); // 👈 log it
        setAppointments(response.data);
      })
      .catch((err) => {
        console.error("❌ Failed to load appointments:", err);
      });
  }, [user]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weekIndex, setWeekIndex] = useState(0);

  const getWeekDates = (weekOffset: number) => {
    const monthStart = startOfMonth(currentMonth);
    const weekStart = addWeeks(
      startOfWeek(monthStart, { weekStartsOn: 1 }),
      weekOffset
    );
    return Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  };

  const currentWeekDates = getWeekDates(weekIndex);

  const handleSlotClick = async (date: Date, time: string) => {
    const dateString = format(date, "yyyy-MM-dd");
    const slotTime = parse(time, "HH:mm", new Date());

    // Check if this slot is part of any existing appointment
    const existing = appointments.find((a) => {
      if (a.date !== dateString) return false;

      const start = parse(a.startTime, "HH:mm", new Date());
      const end = parse(a.endTime, "HH:mm", new Date());

      return slotTime >= start && slotTime < end;
    });

    if (existing) {
      const confirmDelete = confirm(
        `This slot is already booked:\n\nTitle: ${existing.name}\nDescription: ${existing.description}\n\nDo you want to delete it?`
      );
      if (confirmDelete) {
        setAppointments((prev) =>
          prev.filter(
            (a) =>
              !(a.date === existing.date && a.startTime === existing.startTime)
          )
        );
      }
      return;
    }

    const name = prompt(
      `Enter appointment name for ${format(date, "EEE MMM d")} at ${time}:`
    );
    if (!name?.trim()) return;

    const durationStr = prompt("Duration in minutes (30, 60, 90, 120):", "30");
    const duration = parseInt(durationStr || "30", 10);

    if (![30, 60, 90, 120].includes(duration)) {
      alert("Invalid duration. Please enter 30, 60, 90, or 120.");
      return;
    }

    const endTime = format(addMinutes(slotTime, duration), "HH:mm");
    const description = prompt("Enter a short description (optional):") || "";

    const newAppointment: Appointment = {
      date: dateString,
      startTime: time,
      endTime,
      name: name.trim(),
      description,
    };

    console.log(
      `Created appointment: ${newAppointment.name} on ${newAppointment.date} from ${newAppointment.startTime} to ${newAppointment.endTime}`
    );

    axios
      .post(
        "http://localhost:5000/appointments",
        {
          date: newAppointment.date,
          t_start: newAppointment.startTime,
          t_stop: newAppointment.endTime,
          patientId: patient_Id, // still send patientId if you need it in DB
        },
        { withCredentials: true }
      )
      .then((response) => {
        console.log("✅ Appointment saved to DB");

        const { appId } = response.data; // ✅ capture it!

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
      })
      .catch((err) => {
        console.error("❌ Failed to save appointment:", err);
      });

    setAppointments((prev) => {
      const updated = [...prev, newAppointment];
      console.log(
        "Appointments:",
        updated.map((a) => `${a.date} ${a.startTime}-${a.endTime} → ${a.name}`)
      );
      return updated;
    });
  };

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      {/* Sidebar with user info */}
      <div style={{ minWidth: "250px" }}>
        {error && <div style={{ color: "red" }}>{error}</div>}

        {user ? (
          <div>
            <h3>User Info</h3>
            <p>
              <strong>ID:</strong> {user.uid}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <p>
              <strong>Patient ID:</strong> {patient_Id}
            </p>
          </div>
        ) : (
          <p>Loading user...</p>
        )}
      </div>

      <div className="scheduler-wrapper" style={{ flex: 1 }}>
        <div className="week-selector">
          <button
            disabled={weekIndex === 0}
            onClick={() => setWeekIndex(weekIndex - 1)}
          >
            ← Prev Week
          </button>
          <span>Week {weekIndex + 1} of May 2025</span>
          <button
            disabled={weekIndex === 3}
            onClick={() => setWeekIndex(weekIndex + 1)}
          >
            Next Week →
          </button>
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
              {/* Left time column */}
              <div className="grid-time-col">
                {(() => {
                  const slotStart = parse(slot, "HH:mm", new Date());
                  const slotEnd = format(addMinutes(slotStart, 30), "HH:mm");
                  return `${slot} - ${slotEnd}`;
                })()}
              </div>
              {/* Cells per day */}
              {currentWeekDates.map((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const slotTime = parse(slot, "HH:mm", new Date());

                // Find any appointment covering this slot
                const appointment = appointments.find((a) => {
                  if (a.date !== dateStr) return false;
                  const start = parse(a.startTime, "HH:mm", new Date());
                  const end = parse(a.endTime, "HH:mm", new Date());
                  return slotTime >= start && slotTime < end;
                });

                // Only render the top cell of the appointment block
                const isStartBlock = appointment?.startTime === slot;

                if (appointment && !isStartBlock) {
                  // skip rendering overlapping slot
                  return (
                    <div
                      key={`${dateStr}-${slot}`}
                      style={{ display: "none" }}
                    />
                  );
                }

                const duration = appointment
                  ? differenceInMinutes(
                      parse(appointment.endTime, "HH:mm", new Date()),
                      parse(appointment.startTime, "HH:mm", new Date())
                    )
                  : 0;

                const rowSpan = duration / 30;

                return (
                  <div
                    key={`${dateStr}-${slot}`}
                    className={`grid-cell ${appointment ? "selected" : ""}`}
                    style={isStartBlock ? { gridRow: `span ${rowSpan}` } : {}}
                    onClick={() => handleSlotClick(date, slot)}
                  >
                    {isStartBlock ? appointment.name : ""}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentGrid;
