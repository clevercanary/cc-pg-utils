import { Select } from "./commands/Select";
import { Statement } from "./commands/Statement";
import { Where } from "./commands/Where";
export interface Sql {
    select(val: string): Select;
    in(col: string, list: string[] | Select): Statement;
    exists(subquery: Sql): Where;
    eq(col: string, val: any): Where;
    notEq(col: string, val: any): Where;
    lt(col: string, val: any): Where;
    gt(col: string, val: any): Where;
    gte(col: string, val: any): Where;
    not(expression: Where): Where;
    or(...expressions: Where[]): Where;
}
