import { Loader2 } from 'lucide-react';

const style = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: 10, padding: '2px 7px', borderRadius: 6,
  background: '#d4921a20', color: '#d4921a',
  border: '1px solid #d4921a30',
};

export default function PendingBadge() {
  return (
    <span style={style}>
      <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
      En attente
    </span>
  );
}
