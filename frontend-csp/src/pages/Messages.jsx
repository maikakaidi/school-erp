import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../api/fetchWithAuth';
import { MessageSquare, Send, User, Users, GraduationCap, RefreshCw, X, Building2 } from 'lucide-react';

const T = {
  bg: '#06101a', card: '#0c1c2c', border: '#1a3050', accent: '#d4921a',
  text: '#ddd0b8', muted: '#486070',
};

const TYPE_LABELS = { parent: 'Parent', eleve: 'Élève', enseignant: 'Enseignant' };

const TYPE_ICONS = { parent: Users, eleve: GraduationCap, enseignant: User };

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState(false);
  const [recipients, setRecipients] = useState({ parent: [], eleve: [], enseignant: [] });
  const [composeType, setComposeType] = useState('parent');
  const [composeId, setComposeId] = useState('');
  const [sujet, setSujet] = useState('');
  const [contenu, setContenu] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = async () => {
    try {
      const data = await fetchWithAuth('/messages/conversations');
      setConversations(data.conversations || []);
      if (!active && data.conversations?.length > 0) {
        setActive(data.conversations[0]);
      }
    } catch (e) { setConversations([]); }
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!active) { setThread([]); return; }
    fetchWithAuth(`/messages/conversation/${active.actorType}/${active.actorId}`)
      .then((d) => {
        setThread(d.messages || []);
        loadConversations();
      })
      .catch(() => setThread([]));
  }, [active?.actorType, active?.actorId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  const loadRecipients = async (type) => {
    try {
      if (type === 'parent') {
        const d = await fetchWithAuth('/parents');
        setRecipients((r) => ({ ...r, parent: d || [] }));
      } else if (type === 'eleve') {
        const d = await fetchWithAuth('/eleves?limit=100');
        setRecipients((r) => ({ ...r, eleve: d.eleves || [] }));
      } else {
        const d = await fetchWithAuth('/enseignants?limit=100');
        setRecipients((r) => ({ ...r, enseignant: d.enseignants || [] }));
      }
    } catch (e) { /* noop */ }
  };

  const openCompose = (type) => {
    setCompose(true);
    setComposeType(type);
    setComposeId('');
    setSujet('');
    setContenu('');
    loadRecipients(type);
  };

  const sendCompose = async () => {
    if (!composeId || !sujet.trim() || !contenu.trim() || sending) return;
    setSending(true);
    try {
      await fetchWithAuth('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ recipientType: composeType, recipientId: composeId, sujet: sujet.trim(), contenu: contenu.trim() }),
      });
      setCompose(false);
      await loadConversations();
    } catch (e) {
      window.alert(e.message || 'Envoi impossible');
    }
    setSending(false);
  };

  const sendReply = async () => {
    if (!draft.trim() || !active || sending) return;
    setSending(true);
    try {
      await fetchWithAuth('/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientType: active.actorType,
          recipientId: active.actorId,
          sujet: thread.find((m) => m.fromSchool)?.sujet || 'Message',
          contenu: draft.trim(),
        }),
      });
      setDraft('');
      const d = await fetchWithAuth(`/messages/conversation/${active.actorType}/${active.actorId}`);
      setThread(d.messages || []);
      loadConversations();
    } catch (e) {
      window.alert(e.message || 'Envoi impossible');
    }
    setSending(false);
  };

  const fmt = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
      ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const recipientsFor = (type) => recipients[type] || [];

  const labelFor = (type, id) => {
    const list = recipientsFor(type);
    const item = list.find((x) => x.id === id);
    if (type === 'parent') return item ? `${item.nom} (${item.telephone})` : '—';
    if (type === 'eleve') return item ? `${item.prenom} ${item.nom} (${item.matricule})` : '—';
    return item ? `${item.nom} ${item.prenom}` : '—';
  };

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={18} color={T.accent} />
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900 }}>Messagerie</div>
            <div style={{ fontSize: 12, color: T.muted }}>Échangez avec les parents, élèves et enseignants</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['parent', 'eleve', 'enseignant'].map((t) => (
            <button key={t} onClick={() => openCompose(t)} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: T.accent + '18',
              border: `1px solid ${T.accent}40`, color: T.accent, borderRadius: 9,
              padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              <MessageSquare size={13} /> Nouveau à un {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Liste des conversations */}
        <div style={{ width: 280, flexShrink: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, color: T.muted }}>
            CONVERSATIONS ({conversations.length})
          </div>
          <div style={{ maxHeight: 520, overflowY: 'auto' }}>
            {loading && conversations.length === 0 && (
              <div style={{ color: T.muted, fontSize: 12, padding: 20, textAlign: 'center' }}>Chargement...</div>
            )}
            {!loading && conversations.length === 0 && (
              <div style={{ color: T.muted, fontSize: 12, padding: 20, textAlign: 'center' }}>
                Aucune conversation pour le moment.
              </div>
            )}
            {conversations.map((c) => {
              const Icon = TYPE_ICONS[c.actorType] || User;
              const activeConv = active?.actorType === c.actorType && active?.actorId === c.actorId;
              return (
                <button key={`${c.actorType}-${c.actorId}`} onClick={() => setActive(c)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', cursor: 'pointer',
                  background: activeConv ? T.accent + '18' : 'transparent',
                  border: 'none', borderBottom: `1px solid ${T.border}`,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: T.accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} color={T.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.actor.label}
                      </span>
                      {c.unread > 0 && (
                        <span style={{
                          minWidth: 16, height: 16, borderRadius: 8, background: '#b83838', color: '#fff',
                          fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                        }}>{c.unread}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: T.muted }}>{TYPE_LABELS[c.actorType]}{c.actor.sub ? ` • ${c.actor.sub}` : ''}</div>
                    <div style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {c.contenu}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fil de conversation */}
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {!active ? (
            <div style={{ color: T.muted, fontSize: 13, padding: 60, textAlign: 'center' }}>
              Sélectionnez une conversation ou créez-en une nouvelle.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
                <Building2 size={14} color={T.accent} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{active.actor.label}</span>
                <span style={{ fontSize: 11, color: T.muted }}>{TYPE_LABELS[active.actorType]}</span>
                <span style={{ flex: 1 }} />
                <button onClick={() => loadConversations()} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>
                  <RefreshCw size={14} />
                </button>
              </div>

              <div style={{ padding: 16, minHeight: 320, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {thread.length === 0 && (
                  <div style={{ color: T.muted, fontSize: 13, textAlign: 'center', margin: 'auto' }}>Aucun message dans cette conversation.</div>
                )}
                {thread.map((m) => (
                  <div key={m.id} style={{
                    alignSelf: m.fromSchool ? 'flex-start' : 'flex-end',
                    maxWidth: '80%',
                    background: m.fromSchool ? '#101f31' : T.accent + '22',
                    border: `1px solid ${m.fromSchool ? T.border : T.accent + '40'}`,
                    borderRadius: 12, padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: T.muted, fontWeight: 700 }}>
                        {m.fromSchool ? 'École' : active.actor.label}
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
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Répondre..."
                  rows={2}
                  style={{
                    flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10,
                    padding: '10px 12px', color: T.text, fontSize: 13, resize: 'vertical', outline: 'none',
                  }}
                />
                <button onClick={sendReply} disabled={sending || !draft.trim()} style={{
                  alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6,
                  background: T.accent, border: 'none', color: '#fff', borderRadius: 10,
                  padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  opacity: sending || !draft.trim() ? 0.5 : 1,
                }}>
                  <Send size={14} /> Envoyer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modale nouveau message */}
      {compose && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setCompose(false)}>
          <div style={{
            width: 480, maxWidth: '100%', background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: 20,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 900 }}>
                Nouveau message
              </div>
              <button onClick={() => setCompose(false)} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['parent', 'eleve', 'enseignant'].map((t) => (
                <button key={t} onClick={() => { setComposeType(t); setComposeId(''); loadRecipients(t); }} style={{
                  flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: composeType === t ? T.accent + '25' : 'transparent',
                  border: composeType === t ? `1px solid ${T.accent}60` : `1px solid ${T.border}`,
                  color: composeType === t ? T.accent : T.muted,
                }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <select
              value={composeId}
              onChange={(e) => setComposeId(e.target.value)}
              style={{
                width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '9px 12px', color: T.text, fontSize: 13, marginBottom: 12,
              }}
            >
              <option value="">Sélectionner un {TYPE_LABELS[composeType].toLowerCase()}...</option>
              {recipientsFor(composeType).map((x) => (
                <option key={x.id} value={x.id}>
                  {composeType === 'parent' ? `${x.nom} (${x.telephone})` :
                   composeType === 'eleve' ? `${x.prenom} ${x.nom} (${x.matricule})` : `${x.nom} ${x.prenom}`}
                </option>
              ))}
            </select>

            <input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Sujet"
              style={{
                width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '9px 12px', color: T.text, fontSize: 13, marginBottom: 12,
              }}
            />
            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Votre message..."
              rows={4}
              style={{
                width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
                padding: '10px 12px', color: T.text, fontSize: 13, resize: 'vertical', marginBottom: 16, outline: 'none',
              }}
            />

            <button onClick={sendCompose} disabled={sending || !composeId || !sujet.trim() || !contenu.trim()} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: T.accent, border: 'none', color: '#fff', borderRadius: 10,
              padding: '11px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              opacity: sending || !composeId || !sujet.trim() || !contenu.trim() ? 0.5 : 1,
            }}>
              <Send size={14} /> Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
