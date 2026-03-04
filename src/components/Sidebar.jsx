export default function Sidebar({ items, active, onSelect }) {
  return (
    <div className="list-group">
      {items.map((it) => (
        <button
          key={it.key}
          className={"list-group-item list-group-item-action " + (active === it.key ? "active" : "")}
          onClick={() => onSelect(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}