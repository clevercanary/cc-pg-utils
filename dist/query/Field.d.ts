export interface QueryResultField<T> {
    columnID: number;
    dataTypeID: number;
    dataTypeModifier: number;
    dataTypeSize: number;
    format: string;
    name: keyof T;
    tableID: number;
}
