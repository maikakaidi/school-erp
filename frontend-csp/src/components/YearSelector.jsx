import { useAcademicYear } from '../context/AcademicYearContext';

const selectStyle = {
  background: '#06101a',
  border: '1px solid #1a3050',
  borderRadius: 6,
  padding: '5px 8px',
  color: '#ddd0b8',
  fontSize: 12,
  cursor: 'pointer',
};

export default function YearSelector({ value, onChange }) {
  const { years } = useAcademicYear();
  const yearsToShow = years.length > 0 ? years : [{ name: value || '2025-2026', isCurrent: true }];
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={selectStyle}
    >
      {yearsToShow.map((y) => (
        <option key={y.name} value={y.name}>
          {y.name}{y.isCurrent ? ' (courante)' : ''}{y.isArchived ? ' (archivée)' : ''}
        </option>
      ))}
    </select>
  );
}
