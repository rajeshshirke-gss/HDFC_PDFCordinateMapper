export interface ApiEnvelope<T = unknown> {
  success?: boolean;
  Success?: boolean;
  message?: string;
  Message?: string;
  data?: T;
  Data?: T;
}

export function unwrapApiResponse<T = unknown>(response: unknown): T {
  const envelope = response as ApiEnvelope<T>;
  const hasEnvelope = envelope && typeof envelope === 'object'
    && ('success' in envelope || 'Success' in envelope || 'data' in envelope || 'Data' in envelope);

  if (!hasEnvelope) {
    return response as T;
  }

  const success = envelope.success ?? envelope.Success;
  if (success === false) {
    throw new Error(extractDbMessage(response) || 'Request failed.');
  }

  return (envelope.data ?? envelope.Data ?? response) as T;
}

export function dataSetRows<T = Record<string, unknown>>(response: unknown, tableIndex = 0): T[] {
  if (!response) {
    return [];
  }

  const unwrapped = unwrapApiResponse(response);
  if (Array.isArray(unwrapped)) {
    return unwrapped as T[];
  }

  if (!unwrapped || typeof unwrapped !== 'object') {
    return [];
  }

  const source = unwrapped as Record<string, unknown>;
  const tableName = tableIndex === 0 ? 'Table' : `Table${tableIndex}`;
  const camelTableName = tableIndex === 0 ? 'table' : `table${tableIndex}`;
  const direct = source[tableName] ?? source[camelTableName];
  if (Array.isArray(direct)) {
    return direct as T[];
  }

  const nested = source['data'] ?? source['Data'];
  if (nested && typeof nested === 'object') {
    return dataSetRows<T>(nested, tableIndex);
  }

  return [];
}

export function allDataSetRows<T = Record<string, unknown>>(response: unknown): T[] {
  if (!response) {
    return [];
  }

  const unwrapped = unwrapApiResponse(response);
  if (Array.isArray(unwrapped)) {
    return unwrapped as T[];
  }

  if (!unwrapped || typeof unwrapped !== 'object') {
    return [];
  }

  const source = unwrapped as Record<string, unknown>;
  const rows = Object.keys(source)
    .filter((key) => /^table\d*$/i.test(key) && Array.isArray(source[key]))
    .sort((left, right) => tableOrder(left) - tableOrder(right))
    .flatMap((key) => source[key] as T[]);

  if (rows.length) {
    return rows;
  }

  const nested = source['data'] ?? source['Data'];
  if (nested && typeof nested === 'object') {
    return allDataSetRows<T>(nested);
  }

  return dataSetRows<T>(source);
}

export function pickString(row: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = pickValue(row, key);
    if (value !== undefined && value !== null) {
      return String(value).trim();
    }
  }

  return fallback;
}

// export function extractDbMessage(response: unknown): string {
//   if (!response || typeof response !== 'object') {
//     return '';
//   }

//   const source = response as Record<string, unknown>;
//   const direct = source['message'] ?? source['Message'];
//   if (direct) {
//     return String(direct);
//   }

  //   for (const row of dataSetRows<Record<string, unknown>>(response)) {
  //     for (const key of Object.keys(row)) {
  //       if (/msg|message/i.test(key)) {
  //         const value = String(row[key] ?? '').trim();
  //         if (value && value !== '0') {
  //           return value;
  //         }
  //       }
  //     }
  //   }

  //   return '';
// }


export function extractDbMessage(response: unknown): string {
  if (!response || typeof response !== 'object') {
    return '';
  }

  const source = response as Record<string, unknown>;
  const direct = source['message'] ?? source['Message'];
  if (direct) {
    return String(direct);
  }

  const rows = dataSetRows<Record<string, unknown>>(response);

  if (!rows.length) {
    return '';
  }

  const row = rows[0];

  // Prefer success message columns before ERRMSG, because many DB cursors return ERRMSG = 0 with MESSAGE populated.
  const message =
    pickString(row, ['MESSAGE', 'Message', 'message']) ||
    pickString(row, ['MSG', 'Msg', 'msg']) ||
    pickString(row, ['ERRMSG', 'ErrMsg', 'errmsg']);

  return message === '0' || message === '1' ? '' : message;
}




function pickValue(row: Record<string, unknown>, key: string): unknown {
  if (row[key] !== undefined) {
    return row[key];
  }

  const normalizedKey = normalizeKey(key);
  const match = Object.keys(row).find((rowKey) => normalizeKey(rowKey) === normalizedKey);
  return match ? row[match] : undefined;
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function tableOrder(key: string): number {
  const match = key.match(/\d+$/);
  return match ? Number(match[0]) : 0;
}
