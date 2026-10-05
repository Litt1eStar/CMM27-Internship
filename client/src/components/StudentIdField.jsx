/** 11-digit student ID input with the n/11 counter (2a–2c, 5e). */
export default function StudentIdField({ id, value, onChange, invalid = false, required = false, autoFocus = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">
        รหัสนักศึกษา{required && <span className="text-danger"> *</span>}
      </label>
      <input
        id={id}
        className="field tracking-[1.5px] tabular-nums"
        inputMode="numeric"
        autoComplete="off"
        maxLength={11}
        value={value}
        aria-invalid={invalid || undefined}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 11))}
      />
      <div className={`hint flex ${invalid ? 'justify-end' : 'justify-between'}`}>
        {!invalid && <span>ตัวเลข 11 หลัก</span>}
        <span className="tabular-nums">{value.length}/11</span>
      </div>
    </div>
  );
}
