import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import "stream-chat-react/dist/css/v2/index.css";
import "../App.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ChatPage = () => {
  const { channelId } = useParams();
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const initChat = async () => {
      const token = localStorage.getItem("streamToken");
      const streamUser = JSON.parse(localStorage.getItem("streamUser") || "{}");

      if (!token || !streamUser.id) {
        console.error("User not authenticated");
        return;
      }

      const client = StreamChat.getInstance("vs9hb5583yhf");

      if (!client.userID) {
        await client.connectUser(streamUser, token);
        console.log("Connected to Stream", streamUser);
      }

      const existingChannel = client.channel("messaging", channelId!);
      await existingChannel.watch(); // ✅ safer than create()

      setChatClient(client);
      setChannel(existingChannel);
    };

    initChat();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        console.log("Disconnected from Stream");
      }
    };
  }, [channelId]);

  if (!chatClient || !channel) return <div>Loading chat...</div>;

  return (
    <Chat client={chatClient} theme="messaging light">
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
      </Channel>
    </Chat>
  );
};

export default ChatPage;
