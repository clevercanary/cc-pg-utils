import { Select } from "./commands/Select";
import { Insert } from "./commands/Insert";
import { Delete } from "./commands/Delete";
import { Update } from "./commands/Update";
import { QueryResult } from "./query/QueryResult";
import { Params, Statement } from "./commands/Statement";
export interface Client {
    query<T>(queryText: string): Promise<QueryResult<any>>;
    query<T>(queryText: string, values: any[]): Promise<QueryResult<T>>;
    query<T>(query: Params): Promise<QueryResult<T>>;
    select(...columns: string[]): Select;
    select(columns: string[]): Select;
    select(columns: string): Select;
    insert<T>(table: string, values: Partial<T>): Insert<T>;
    insert<T>(table: string, ...fields: (keyof Partial<T>)[]): Insert<T>;
    delete(table: string): Delete;
    update(): Update;
    applyQuery<T>(select: Statement): Promise<QueryResult<T>>;
    count(select: Statement): Promise<QueryResult<{
        count: number;
    }>>;
    release(): void;
}
