import React, { useState, useEffect } from "react";
import axios from "axios";

const ChatList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/chat/users"
        );
        setUsers(response.data.users);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h1>StreamChat Users</h1>
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>
            <strong>{user.id}</strong>: {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;
