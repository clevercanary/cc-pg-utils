import { QueryResultField } from "./Field";
export interface QueryResultMetadata<T> {
    command: "SELECT" | "INSERT" | "DELETE" | "UPDATE";
    fields: QueryResultField<T>[];
    oid: number;
    rowAsArray: boolean;
    rowCount: number;
    addCommandComplete(msg: string): any;
    addFields(fieldDescriptions: string): any;
    addRow(row: any): any;
    parseRow(rowData: T): any;
}
