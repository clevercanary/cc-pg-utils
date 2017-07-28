import { Statement } from "./Statement";
import { Where } from "./Where";
import { Dictionary } from "../QueryBuilder";

export interface Delete extends Statement {
    using(field: string): this;
    from(table: string): this;
    where(key: string, val: any): this;
    where(criteria: Dictionary<any>): this;
    where(whereExpr: Where): this;
}
