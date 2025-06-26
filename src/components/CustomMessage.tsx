import {
  useMessageContext,
  useChannelStateContext,
  useChatContext,
  MessageSimple,
} from "stream-chat-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const CustomMessage = () => {
  const { message } = useMessageContext();
  const { client } = useChatContext();

  const [hasClicked, setHasClicked] = useState(false);
  const [locallyConfirmed, setLocallyConfirmed] = useState(false);

  if (!message) return null;

  const isAppointmentRequest =
    (message as any)?.customType === "appointmentRequest";
  const status = (message as any)?.customData?.status || "pending";

  const isPatient = client.userID?.startsWith("REG");
  const isMyMessage = message.user?.id === client.userID;
  const appId = (message as any)?.customData?.appId;
  const label = (message as any)?.customData?.label || "Confirm Appointment";
  const [locallyUnavailable, setLocallyUnavailable] = useState(false);

  const isActuallyConfirmed =
    !locallyUnavailable &&
    (locallyConfirmed || status === "confirmed" || status === "completed");

  if (!isAppointmentRequest) {
    return <MessageSimple />; //
  }

  const handleConfirmClick = async () => {
    if (!isPatient || hasClicked) return;

    try {
      await axios.post(
        "http://localhost:5000/confirmAppointment",
        { appId },
        { withCredentials: true }
      );

      if (!message.user?.id) {
        console.error("No message.user.id");
        return;
      }

      console.log("🔄 Sending POST to /confirmAppointment with appId:", appId);
      const confirmRes = await axios.post(
        "http://localhost:5000/api/chat/confirm-appointment-chat",
        {
          messageId: message.id,
          userId: message.user.id,
          appId: appId,
        },
        { withCredentials: true }
      );
      console.log("/confirmAppointment response:", confirmRes.data);

      if (message && (message as any).customData) {
        (message as any).customData.status = "confirmed";
      }

      setLocallyConfirmed(true);
      setHasClicked(true);
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  const checkedAppIds = useRef(new Set<string>());

  useEffect(() => {
    setLocallyUnavailable(false);
    setLocallyConfirmed(false);
    const checkAppointmentStatus = async () => {
      if (!appId || checkedAppIds.current.has(appId)) return;

      checkedAppIds.current.add(appId);
      setLocallyUnavailable(false);
      console.log("📦 Checking appointment with ID:", appId);

      try {
        const response = await axios.get(
          "http://localhost:5000/api/chat/check-appointment-status",
          { params: { appId }, withCredentials: true }
        );

        console.log("Appointment status response:", response.data);

        if (
          response.data?.status === "confirmed" ||
          response.data?.status === "completed"
        ) {
          setLocallyConfirmed(true);
        }
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          console.warn(`⚠️ Appointment not found for appId: ${appId}`);
          setLocallyUnavailable(true);
        } else {
          console.error("Failed to check appointment status:", error);
        }
      }
    };

    checkAppointmentStatus();
  }, [appId]);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: isMyMessage ? "flex-end" : "flex-start",
          padding: "4px 12px",
        }}
      >
        {locallyUnavailable ? (
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              borderRadius: "18px",
              fontWeight: "bold",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Appointment Unavailable
          </div>
        ) : status === "canceled" ? (
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "#ff9800",
              color: "white",
              borderRadius: "18px",
              fontWeight: "bold",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Appointment Canceled
          </div>
        ) : isActuallyConfirmed ? (
          <div
            style={{
              padding: "10px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "18px",
              fontWeight: "bold",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            Appointment Confirmed
          </div>
        ) : (
          <button
            onClick={handleConfirmClick}
            disabled={!isPatient || hasClicked}
            style={{
              padding: "10px 16px",
              backgroundColor: hasClicked || !isPatient ? "#adb5bd" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "18px",
              cursor: hasClicked || !isPatient ? "default" : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              opacity: hasClicked || !isPatient ? 0.6 : 1,
            }}
          >
            {label}
          </button>
        )}
      </div>
    </div>
  );
};
export default CustomMessage;
