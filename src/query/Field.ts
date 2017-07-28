export interface QueryResultField<T> {
    columnID: number;
    dataTypeID: number;
    dataTypeModifier: number;
    dataTypeSize: number;
    format: string; // "text" |
    name: keyof T;
    tableID: number;
}