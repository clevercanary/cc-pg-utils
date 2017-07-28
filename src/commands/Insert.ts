import { Statement } from "./Statement";
import { Select } from "./Select";

export interface Insert<T> extends Statement {

    // values corresponding to the columns in order of the insert;
    values(...values: any[]): this;
    values(...values: any[][]): this;
    values(rowValues: Partial<T>): this;
    values(rowValues: Partial<T>[]): this;
    select(fields?: string): Select;

    //PG
    returning<T>(...args: string[]): Insert<T>;
}