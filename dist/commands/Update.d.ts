import { Statement } from "./Statement";
import { Where } from "./Where";
import { Dictionary } from "../QueryBuilder";
export interface Update extends Statement {
    from(field: string): this;
    set(col: string, val: any): this;
    where(key: string, val: any): this;
    where(criteria: Dictionary<any>): this;
    where(whereExpr: Where): this;
}
