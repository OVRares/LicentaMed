import { useEffect, useState, useRef } from "react";
import { StreamChat, ChannelMemberResponse } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import axios from "axios";
import CustomMessage from "../components/CustomMessage";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useChatContext } from "../components/ChatContext";

const ChatSplitPage = () => {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const [repliedChannels, setRepliedChannels] = useState<any[]>([]);
  const [requestChannels, setRequestChannels] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState<null | {
    uid: string;
    email: string;
    role: string;
  }>(null);
  const [view, setView] = useState<"inbox" | "requests">("inbox");
  const [chatReady, setChatReady] = useState(false);
  const navigate = useNavigate();
  const { setUnreadCount } = useChatContext();

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    client?.disconnectUser();
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await axios.get("http://localhost:5000/session", {
          withCredentials: true,
        });
        setSessionUser(res.data.user);
      } catch (err) {
        console.error("Session load failed", err);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const initChat = async () => {
      if (!sessionUser) return;

      const token = localStorage.getItem("streamToken");
      const streamUser = JSON.parse(localStorage.getItem("streamUser") || "{}");

      if (!token || !streamUser.id) return;

      const chatClient = StreamChat.getInstance("vs9hb5583yhf");
      if (!chatClient.userID) {
        await chatClient.connectUser(streamUser, token);
      }

      const queriedChannels = await chatClient.queryChannels(
        {
          type: "messaging",
          members: { $in: [streamUser.id] },
        },
        { last_message_at: -1 },
        { watch: true, state: true }
      );

      const filteredReplied = queriedChannels.filter((channel) =>
        channel.state.messages.some((msg) => msg.user?.id === streamUser.id)
      );

      const filteredRequest = queriedChannels.filter(
        (channel) =>
          !channel.state.messages.some((msg) => msg.user?.id === streamUser.id)
      );

      setClient(chatClient);
      setChannels(queriedChannels);
      setRepliedChannels(filteredReplied);
      setRequestChannels(filteredRequest);

      if (view === "inbox" && filteredReplied.length > 0) {
        setActiveChannel(filteredReplied[0]);
      } else if (view === "requests" && filteredRequest.length > 0) {
        setActiveChannel(filteredRequest[0]);
      } else {
        setActiveChannel(null);
      }
      setUnreadCount(filteredRequest.length);
      setChatReady(true);
    };

    initChat();
  }, [sessionUser, view]);

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
            >
              Appointments
            </Button>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Button
                width="80px"
                color="blue"
                variant="filled-alt"
                onClick={() => navigate("/splitchats")}
                selected={location.pathname === "/splitchats"}
              >
                Chat
              </Button>

              {requestChannels.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    backgroundColor: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    lineHeight: 1,
                  }}
                >
                  {requestChannels.length}
                </div>
              )}
            </div>

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

        <div className="chat-split-layout">
          <div className="chat-split-container">
            <div className="chat-sidebar">
              <div className="chat-toggle">
                <Button
                  color="blue"
                  variant="filled"
                  className={`toggle-button ${
                    view === "inbox" ? "selected" : ""
                  }`}
                  onClick={() => setView("inbox")}
                >
                  Inbox
                </Button>

                <Button
                  width="190px"
                  color="blue"
                  variant="filled"
                  className={`toggle-button ${
                    view === "requests" ? "selected" : ""
                  }`}
                  onClick={() => setView("requests")}
                >
                  Mesaje Noi
                </Button>
              </div>

              {!chatReady ? (
                <div className="text-muted ms-3">
                  Se încarcă conversațiile...
                </div>
              ) : (view === "inbox" ? repliedChannels : requestChannels)
                  .length > 0 ? (
                (view === "inbox" ? repliedChannels : requestChannels).map(
                  (channel) => (
                    <div
                      key={channel.id}
                      className={`chat-card ${
                        channel.id === activeChannel?.id ? "active" : ""
                      }`}
                      onClick={async () => {
                        if (channel.id !== activeChannel?.id) {
                          await channel.watch();
                          setActiveChannel(channel);
                        }
                      }}
                    >
                      <div className="chat-name">
                        {channel.data?.name || channel.id}
                      </div>
                      <div className="chat-subtext">
                        {channel.state.messages?.at(-1)?.text ||
                          "No messages yet"}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="text-muted ms-3">
                  Nicio conversație de afișat.
                </div>
              )}
            </div>

            <div className="chat-main">
              {client && activeChannel && (
                <>
                  <Chat client={client} theme="messaging light">
                    <Channel channel={activeChannel}>
                      <Window>
                        <div style={{ position: "relative" }}>
                          <Window>
                            <ChannelHeader />
                          </Window>

                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "16px",
                              zIndex: 2,
                            }}
                          >
                            <button
                              onClick={() => {
                                if (!activeChannel) return;

                                const members = Object.values(
                                  activeChannel.state?.members || {}
                                ) as ChannelMemberResponse[];
                                const patientMember = members.find((m) =>
                                  m.user?.id?.startsWith("REG")
                                );
                                const patientId = patientMember?.user?.id;

                                navigate("/testscheduler", {
                                  state: {
                                    patientId,
                                    channelId: activeChannel?.id,
                                  },
                                });
                              }}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#FFCA0A",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "14px",
                              }}
                            >
                              Mergi La Calendar
                            </button>
                          </div>
                        </div>
                        <MessageList Message={CustomMessage} />
                        <MessageInput />
                      </Window>
                    </Channel>
                  </Chat>
                </>
              )}
            </div>
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
              <p> Phone: +40 123 456 789</p>
              <p> Email: contact@minervamed.ro</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatSplitPage;
