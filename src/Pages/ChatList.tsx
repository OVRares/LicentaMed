import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { Link } from "react-router-dom";

const ChatListPage = () => {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("streamToken");
      const streamUser = JSON.parse(localStorage.getItem("streamUser") || "{}");

      if (!token || !streamUser.id) return;

      const client = StreamChat.getInstance("vs9hb5583yhf");

      if (!client.userID) {
        await client.connectUser(streamUser, token);
      }

      const result = await client.queryChannels({
        type: "messaging",
        members: { $in: [streamUser.id] },
      });

      setChannels(result);
      setLoading(false);
    };

    init();
  }, []);

  if (loading) return <div>Loading chats...</div>;

  return (
    <div className="chat-list-container">
      <h2>My Chats</h2>
      <div className="chat-grid">
        {channels.map((channel) => (
          <Link
            to={`/chat/${channel.id}`}
            className="chat-card"
            key={channel.id}
          >
            <div className="chat-name">
              {channel.data?.name || `Chat: ${channel.id}`}
            </div>
            <div className="chat-subtext">
              {channel.data?.email || "No metadata"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatListPage;
