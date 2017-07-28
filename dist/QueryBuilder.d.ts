import { QueryModel } from "cc-qm";
import { Select } from "./commands/Select";
export interface Dictionary<T> {
    [key: string]: T;
}
export declare class QueryBuilder {
    primaryTable: string;
    qualifiedColumns: Dictionary<string>;
    joins: Dictionary<{
        table: string;
        through: string;
    }>;
    constructor(primaryTable: string, qualifiedColumns: Dictionary<string>, joins?: Dictionary<{
        table: string;
        through: string;
    }>);
    /**
     * Build Query
     *
     * @param select
     * @param qm
     */
    buildQuery(select: Select, qm: QueryModel): void;
    /**
     * Get table-qualified column name
     *
     * @param select
     * @param field
     * @returns {string}
     */
    private getQualifiedColumn(field);
    /**
     * Add Sort Order
     *
     * @param select
     * @param sorts
     */
    private addSorts(select, sorts);
    /**
     * Add Filters
     *
     * @param select
     * @param filters
     */
    private addFilters(select, filters);
    private buildPgFilter(filter);
    private addConditionalFilter(filter);
    private buildInListSubQuery(select, fieldName, filterType, values);
}
