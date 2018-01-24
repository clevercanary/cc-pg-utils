import { Select } from "./commands/Select";
import { Statement } from "./commands/Statement";
import { Where } from "./commands/Where";
export interface Sql {
    (statement: string): Sql;
    val(value: string): Sql;
    select(...columns: string[]): Select;
    select(columns: string[]): Select;
    select(columns: string): Select;
    and(where: Where): Select;
    and(where: Where[]): Select;
    and(...where: Where[]): Select;
    in(col: string, list: string[]): Statement;
    in(col: string, list: number[]): Statement;
    in(col: string, list: Select): Statement;
    exists(subquery: Sql): Where;
    eq(col: string, val: any): Where;
    notEq(col: string, val: any): Where;
    lt(col: string, val: any): Where;
    gt(col: string, val: any): Where;
    gte(col: string, val: any): Where;
    not(expression: Where): Where;
    or(...expressions: Where[]): Where;
    ilike(column: string, query: string): any;
}
