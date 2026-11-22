export const toCsv = (rows: string[][]): string => rows.map((row) => row.join(',')).join('\n');
