import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import CustomMessage from "../components/CustomMessage";
import Button from "../components/Button";
import axios from "axios";

const ChatSplitPageReg = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any>(null);

  const [searchParams] = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true });
    client?.disconnectUser();
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("streamToken");
      const streamUser = JSON.parse(localStorage.getItem("streamUser") || "{}");

      if (!token || !streamUser.id) return;

      const chatClient = StreamChat.getInstance("vs9hb5583yhf");
      if (!chatClient.userID) {
        await chatClient.connectUser(streamUser, token);
      }

      const queriedChannels = await chatClient.queryChannels({
        type: "messaging",
        members: { $in: [streamUser.id] },
      });

      setChannels(queriedChannels);
      setClient(chatClient);
      const matchedChannel =
        queriedChannels.find((ch) => ch.id === urlChannelId) ||
        queriedChannels[0];

      setActiveChannel(matchedChannel);
      setClient(chatClient);
    };

    init();

    return () => {
      client?.disconnectUser();
    };
  }, []);

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
              onClick={() => navigate("/appointments_reg")}
            >
              Appointments
            </Button>
            <Button
              width="80px"
              color="blue"
              variant="filled-alt"
              onClick={() => navigate("/rsplitchats")}
              selected={location.pathname === "/rsplitchats"}
            >
              Chat
            </Button>
            <Button
              width="110px"
              color="blue"
              variant="filled-alt"
              onClick={() => navigate("/search")}
            >
              Search
            </Button>
          </div>

          <div className="header-right">
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
              <h2 className="chat-sidebar-title">Conversațiile Mele</h2>
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`chat-card ${
                    channel.id === activeChannel?.id ? "active" : ""
                  }`}
                  onClick={() => setActiveChannel(channel)}
                >
                  <div className="chat-name">
                    {channel.data?.name || channel.id}
                  </div>
                  <div className="chat-subtext">
                    {channel.state.messages?.at(-1)?.text || "No messages yet"}
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-main">
              {client && activeChannel && (
                <Chat client={client} theme="messaging light">
                  <Channel channel={activeChannel}>
                    <Window>
                      <ChannelHeader />
                      <MessageList Message={CustomMessage} />
                      <MessageInput />
                    </Window>
                  </Channel>
                </Chat>
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
              <p>📞 Phone: +40 123 456 789</p>
              <p>📧 Email: contact@minervamed.ro</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatSplitPageReg;
