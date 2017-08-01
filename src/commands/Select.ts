import { Where } from "./Where";
import { Insert } from "./Insert";
import { QueryResult } from "../query/QueryResult";
import { Statement } from "./Statement";
export interface JoinCriteria {
    [fromColumn: string]: string;
}

export interface Dictionary<T> {
    [key: string]: string;
}

export interface Select extends Statement {
    and(): any;
    as(alias: string): any;
    crossJoin(...tables: string[]): this;
    crossJoin(tables: string, criteria: JoinCriteria): this;
    distinct(): any;
    except(): any;
    exceptAll(): any;
    forUpdate(): any;
    from(table: string): this;
    fullJoin(...tables: string[]): this;
    fullJoin(tables: string, criteria: JoinCriteria): this;
    fullOuterJoin(...tables: string[]): this;
    fullOuterJoin(tables: string, criteria: JoinCriteria): this;
    // group(): any;
    groupBy(field: string): this;
    having(query: string, value: any): any;
    innerJoin(...tables: string[]): this;
    innerJoin(tables: string, criteria: JoinCriteria): this;
    intersect(): any;
    intersectAll(): any;
    into(tbl: string): any;
    intoTable(tbl: string): any;
    intoTemp(tbl: string): any;
    join(...tables: string[]): this;
    join(tables: string, criteria: JoinCriteria): this;
    leftJoin(...tables: string[]): this;
    leftJoin(tables: string, criteria: JoinCriteria): this;
    leftOuterJoin(...tables: string[]): this;
    leftOuterJoin(tables: string, criteria: JoinCriteria): this;
    naturalFullJoin(...tables: string[]): this;
    naturalFullJoin(tables: string, criteria: JoinCriteria): this;
    naturalFullOuterJoin(...tables: string[]): this;
    naturalFullOuterJoin(tables: string, criteria: JoinCriteria): this;
    naturalInnerJoin(...tables: string[]): this;
    naturalInnerJoin(tables: string, criteria: JoinCriteria): this;
    naturalJoin(...tables: string[]): this;
    naturalJoin(tables: string, criteria: JoinCriteria): this;
    naturalLeftJoin(...tables: string[]): this;
    naturalLeftJoin(tables: string, criteria: JoinCriteria): this;
    naturalLeftOuterJoin(...tables: string[]): this;
    naturalLeftOuterJoin(tables: string, criteria: JoinCriteria): this;
    naturalRightJoin(...tables: string[]): this;
    naturalRightJoin(tables: string, criteria: JoinCriteria): this;
    naturalRightOuterJoin(...tables: string[]): this;
    naturalRightOuterJoin(tables: string, criteria: JoinCriteria): this;
    noWait(): any;
    of(): any;
    on(): any;
    // order(): any;
    orderBy(field: string): this;
    rightJoin(...tables: string[]): this;
    rightJoin(tables: string, criteria: JoinCriteria): this;
    select(...columns: string[]): this;
    select(columns: string[]): this;
    select(columns: string): this;
    union(): any;
    unionAll(): any;
    using(columns: string[]): this; // this has to come after a Join has been added.

    where(key: string, val: any): this;
    where(criteria: Dictionary<any>): this;
    where(whereExpr: Where): this;

    // PG
    limit(value: number): Select;
    offset(value: number): Select;

    count<T>(select: Select): Promise<QueryResult<{ count: number }>>;
    applyQuery<T>(select: Select): Promise<QueryResult<T>>;
}


