import { QueryResultField } from "./Field";

export interface QueryResultMetadata<T> {
    command: "SELECT" | "INSERT" | "DELETE" | "UPDATE";
    fields: QueryResultField<T>[];
    oid: number; // ? I see NaN;
    rowAsArray: boolean;
    rowCount: number;

    // prototype, do we need these?
    addCommandComplete(msg: string): any;
    addFields(fieldDescriptions: string): any;
    addRow(row: any): any;
    parseRow(rowData: T /* and/or T[] ?*/): any;
}