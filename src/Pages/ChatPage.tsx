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
import { useEffect, useState } from "react";

const ChatPage = () => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const initChat = async () => {
      console.log("Starting chat init");

      const token = localStorage.getItem("streamToken");
      const streamUser = JSON.parse(localStorage.getItem("streamUser") || "{}");

      let client;
      if (token && streamUser) {
        client = StreamChat.getInstance("vs9hb5583yhf");

        // Only connect if user is not already connected
        if (!client.userID) {
          await client.connectUser(streamUser, token);
          console.log("Connected to Stream");
        }
      } else {
        console.error("User is not authenticated");
        return; // Exit early if user is not authenticated
      }

      const newChannel = client.channel(
        "messaging",
        `doc-chat-${streamUser.id}`,
        {
          name: `Test Chat for Dr. ${streamUser.name}`,
          members: [streamUser.id],
        }
      );

      await newChannel.create();
      console.log("Created test channel");

      setChatClient(client); // Set the chat client
      setChannel(newChannel); // Set the channel
    };

    initChat();

    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
        console.log("Disconnected from Stream");
      }
    };
  }, []); // Empty dependency array ensures this effect runs once on mount

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
