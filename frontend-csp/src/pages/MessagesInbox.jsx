import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { Send, MessageSquare, Building2, User } from 'lucide-react';

const T = {
  bg: '#06101a', card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070', green: '#1d9468',
};

export default function MessagesInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const data = await fetchWithAuth('/messages/me');
      setMessages(data.messages || []);
    } catch (e) { setMessages([]); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetchWithAuth('/messages/me/read', { method: 'POST' }).catch(() => {});
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await fetchWithAuth('/messages/reply', { method: 'POST', body: JSON.stringify({ contenu: draft.trim() }) });
      setDraft('');
      await load();
      fetchWithAuth('/messages/me/read', { method: 'POST' }).catch(() => {});
    } catch (e) {
      window.alert(e.message || 'Envoi impossible');
    }
    setSending(false);
  };

  const fmt = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && messages.length === 0) {
    return <div style={{ color: T.muted, padding: 40, textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={18} color={T.accent} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 900 }}>Messagerie</div>
          <div style={{ fontSize: 12, color: T.muted }}>Échangez avec votre établissement</div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
          <Building2 size={14} color={T.accent} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Conversation avec l'école</span>
        </div>

        <div style={{ padding: 16, minHeight: 260, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', margin: 'auto' }}>
              Aucun message. Écrivez à votre établissement.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{
              alignSelf: m.fromSchool ? 'flex-start' : 'flex-end',
              maxWidth: '82%',
              background: m.fromSchool ? '#101f31' : T.accent + '22',
              border: `1px solid ${m.fromSchool ? T.border : T.accent + '40'}`,
              borderRadius: 12,
              padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {m.fromSchool ? <Building2 size={12} color={T.muted} /> : <User size={12} color={T.accent} />}
                <span style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>
                  {m.fromSchool ? 'École' : 'Vous'}
                </span>
                <span style={{ fontSize: 9, color: T.muted }}>{fmt(m.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, color: T.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.contenu}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${T.border}`, background: '#081320' }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Votre message..."
            rows={2}
            style={{
              flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10,
              padding: '10px 12px', color: T.text, fontSize: 13, resize: 'vertical', outline: 'none',
            }}
          />
          <button onClick={send} disabled={sending || !draft.trim()} style={{
            alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6,
            background: T.accent, border: 'none', color: '#fff', borderRadius: 10,
            padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: sending || !draft.trim() ? 0.5 : 1,
          }}>
            <Send size={14} /> Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
