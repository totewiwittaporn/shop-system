type TableProps = {
  headers: string[];
  data: (string | number)[][];
};

export default function Table({ headers, data }: TableProps) {
  return (
    <table className="w-full border-collapse border border-[var(--color-border)]">
      <thead className="bg-[var(--color-bg-card)]">
        <tr>
          {headers.map((header, idx) => (
            <th
              key={idx}
              className="border border-[var(--color-border)] px-4 py-2 text-left text-[var(--color-text)]"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIdx) => (
          <tr key={rowIdx} className="hover:bg-[var(--color-bg-card)]">
            {row.map((cell, cellIdx) => (
              <td
                key={cellIdx}
                className="border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-muted)]"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
