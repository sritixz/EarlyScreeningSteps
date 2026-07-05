import { useCallback, useRef, useState } from 'react';
import client, { getErrorMessage } from '../api/client.js';
import usePolling from '../hooks/usePolling.js';
import { useAuth } from '../context/AuthContext.jsx';

const POLL_MS = 4000;

export default function MessageThread({ screeningId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const latestTimestamp = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await client.get(`/messages/${screeningId}`);
      setMessages(res.data.messages);
      if (res.data.messages.length) {
        latestTimestamp.current =
          res.data.messages[res.data.messages.length - 1].createdAt;
      }
      client.patch(`/messages/${screeningId}/read`).catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [screeningId]);

  usePolling(fetchMessages, POLL_MS, [screeningId]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      await client.post(`/messages/${screeningId}`, { body });
      setBody('');
      await fetchMessages();
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3>Messages</h3>
      {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <div className="thread">
        {messages.length === 0 && (
          <p className="muted text-sm">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m._id} className={`msg ${m.senderId?._id === user._id ? 'mine' : 'theirs'}`}>
            <span className="sender">{m.senderId?.name || m.senderRole}</span>
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="composer" onSubmit={send}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
        />
        <button className="btn btn-primary" disabled={sending || !body.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
