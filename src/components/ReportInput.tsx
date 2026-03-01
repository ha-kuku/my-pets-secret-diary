const PLACEHOLDER =
  '예: 내 비싼 슬리퍼 물어뜯어 놓고 모르는 척함';
const MAX_REPORT_LENGTH = 100;

type ReportInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

export function ReportInput({
  value,
  onChange,
  disabled = false,
  error,
}: ReportInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, MAX_REPORT_LENGTH);
    onChange(next);
  };

  const hasError = error !== undefined && error.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="report"
        className="text-amber-900 font-medium text-sm"
      >
        오늘 이 녀석이 친 사고나 있었던 일 딱 한 줄
      </label>
      <textarea
        id="report"
        value={value}
        onChange={handleChange}
        placeholder={PLACEHOLDER}
        disabled={disabled}
        rows={2}
        maxLength={MAX_REPORT_LENGTH}
        className={`
          w-full px-4 py-3 rounded-xl border-2 resize-none
          placeholder:text-amber-400/70
          focus:outline-none focus:ring-2 focus:ring-amber-400/50
          disabled:bg-amber-50/50 disabled:cursor-not-allowed
          ${hasError ? 'border-red-300 bg-red-50/30' : 'border-amber-200 bg-white'}
        `}
      />
      <div className="flex justify-between items-center">
        <span className={`text-sm ${hasError ? 'text-red-600' : 'text-amber-600/80'}`}>
          {hasError ? error : `${value.length}/${MAX_REPORT_LENGTH}`}
        </span>
      </div>
    </div>
  );
}
