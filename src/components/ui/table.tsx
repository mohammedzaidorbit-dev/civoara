import React from 'react';

export function Table({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className={`w-full caption-bottom text-sm text-left ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`transition-colors hover:bg-slate-50/80 data-[state=selected]:bg-slate-100 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className = '',
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-11 px-4 text-left align-middle font-semibold text-slate-700 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className = '',
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`p-4 align-middle text-slate-800 text-sm [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableEmpty({
  title = 'No records found',
  description = 'There are no items matching this criteria.',
  icon,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={100} className="p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
          {icon}
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 max-w-sm">{description}</p>
        </div>
      </td>
    </tr>
  );
}
