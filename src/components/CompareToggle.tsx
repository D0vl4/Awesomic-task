interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function CompareToggle({ checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="switch"
      onClick={() => onChange(!checked)}
    >
      Compare previous period
      <span className="switch__track" aria-hidden>
        <span className="switch__thumb" />
      </span>
    </button>
  );
}
