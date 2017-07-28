import { QueryResultMetadata } from "./Metadata";
export interface QueryResult<T> extends QueryResultMetadata<T> {
    rows: T[];
}
