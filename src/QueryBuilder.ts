import { QueryModel } from "cc-qm";
import { ConditionalQueryFilter } from "cc-qm/dist/filter/conditional-queryfilter";
import { QueryFilter } from "cc-qm/dist/filter/queryfilter";
import { Filter } from "cc-qm/dist/QueryModel";
import { isNullOrUndefined } from "util";
import { Sort } from "cc-qm/dist/sort";
import { Select } from "./commands/Select";

import { Pool } from "./Pool"

const eq = Pool.sql.eq;
const notEq = Pool.sql.notEq;
const $in = Pool.sql.in;
const or = Pool.sql.or;
const not = Pool.sql.not;
const select = Pool.sql.select;

import * as _ from "lodash";
import { Where } from "./commands/Where";

export interface Dictionary<T> {
    [key: string]: T;
}

const FILTER_TYPE = {
    EQUALS: "EQUALS",
    NOT: "NOT",
    IN: "IN",
    AND: "AND",
    OR: "OR",
    NIN: "NIN"
};

export class QueryBuilder {

    primaryTable: string;
    // mapping from qm model field to table-qualified field
    // e.g. "product_name" => "pp.product_name"
    qualifiedColumns: Dictionary<string>;
    joins: Dictionary<{ table: string; through: string; }>;

    constructor(primaryTable: string, qualifiedColumns: Dictionary<string>, joins?: Dictionary<{ table: string; through: string; }>) {

        this.primaryTable = primaryTable;
        this.qualifiedColumns = qualifiedColumns;
        this.joins = joins;

        if (!this.qualifiedColumns["id"]) {
            throw new Error(`Primary table ${primaryTable} needs an 'id' qualifier`);
        }
    }

    /**
     * Build Query
     *
     * @param select
     * @param qm
     */
    buildQuery(select: Select, qm: QueryModel): void {

        if (qm.isPaginated()) {
            if (!isNullOrUndefined(qm.getOffset())) {
                select.offset(qm.getOffset());
            }
            if (!isNullOrUndefined(qm.getLimit())) {
                select.limit(qm.getLimit());
            }
        }

        this.addFilters(select, qm.getFilters());

        if (qm.isSortable()) {
            this.addSorts(select, qm.getSorts());
        }
    }

    /**
     * Get table-qualified column name
     *
     * @param select
     * @param field
     * @returns {string}
     */
    private getQualifiedColumn(field: string): string {

        if (!this.qualifiedColumns[field]) {
            throw new Error(`${field} has no table qualifier.`)
        }
        return this.qualifiedColumns[field];
    }

    /**
     * Add Sort Order
     *
     * @param select
     * @param sorts
     */
    private addSorts(select: Select, sorts: Sort[]) {

        const sortArr = sorts.reduce((acc, sort) => {
            const qualifiedField = this.getQualifiedColumn(sort.fieldName);
            const order = sort.asc ? "ASC" : "DESC";
            acc.push(`${qualifiedField} ${order}`);
            return acc;
        }, []);
        select.orderBy(sortArr.join(","));
    }

    /**
     * Add Filters
     *
     * @param select
     * @param filters
     */
    private addFilters(select: Select, filters: Filter[]) {

        // add conditional filters to the query, and reduce the other
        // filters by field queries on the same column need to be
        // turned into sub queries. We need to do this to check if
        // we need to construct any subqueries
        const filterByField: Dictionary<QueryFilter[]> = filters.reduce((acc: Dictionary<QueryFilter[]>, filter: QueryFilter) => {
            if (QueryModel.isConditionalQueryFilter(filter)) {
                // add or conditions
                select.where(this.addConditionalFilter(filter as ConditionalQueryFilter));
                return acc;
            }
            acc[filter.fieldName] = !acc[filter.fieldName] ? [filter] : acc[filter.fieldName].concat(filter);
            return acc;
        }, {});

        // iterate through each column, processing it's filters.
        Object.keys(filterByField).forEach((fieldName: string) => {

            const fieldFilters = filterByField[fieldName];
            if (fieldFilters.length === 1) {
                // if there is only one, it's just a basic filter on that column.
                return select.where(this.buildPgFilter(fieldFilters[0]));
            }

            // group this columns filters by type
            const filterByType: Dictionary<QueryFilter[]> = _.groupBy(fieldFilters, "filterType");

            if (filterByType[FILTER_TYPE.EQUALS]) {
                // if multiple equals/not equals on the same field, we need a subquery to convert it to `IN`
                if (filterByType[FILTER_TYPE.EQUALS].length > 1) {
                    select.where(this.buildInListSubQuery(select, fieldName, FILTER_TYPE.EQUALS, fieldFilters.map(f => f.value)));
                }
                else {
                    select.where(this.buildPgFilter(filterByType[FILTER_TYPE.EQUALS][0]));
                }
            }

            fieldFilters.forEach((filter: QueryFilter) => {
                if (filter.filterType === FILTER_TYPE.EQUALS) {
                    // skip the EQUALS filters we already processed
                    return;
                }
                return select.where(this.buildPgFilter(filter));
            });
        });
    }


    private buildPgFilter(filter: QueryFilter): Where {

        if (QueryModel.isConditionalQueryFilter(filter)) {
            return this.addConditionalFilter(filter as ConditionalQueryFilter);
        }

        const fieldName = this.getQualifiedColumn(filter.fieldName);

        if (isNullOrUndefined(fieldName)) {
            throw new Error(`${filter.fieldName} has no qualified column`);
        }

        if (filter.filterType === FILTER_TYPE.EQUALS) {
            return eq(fieldName, filter.value);
        }
        else if (filter.filterType === FILTER_TYPE.NOT) {
            return notEq(fieldName, filter.value);
        }
        else if (filter.filterType === FILTER_TYPE.IN) {
            return $in(fieldName, filter.value);
        }
    }

    private addConditionalFilter(filter: ConditionalQueryFilter) {

        if (filter.filterType === FILTER_TYPE.AND) {
            // this shouldn't ever need to happen. all "AND" queries are implicit by adding separate queries.
            // if we need to handle multiple requests on the same field, it needs to be an applied subquery.
            throw new Error(`Explicit AND query isn't currently implemented`);
        }
        else if (filter.filterType === FILTER_TYPE.OR) {
            const filters = filter.conditions.map(condition => this.buildPgFilter(condition));
            return or.apply(null, filters);
        }
        else {
            throw new Error(`Invalid filter type: ${filter.filterType}`);
        }
    }

    private buildInListSubQuery(select: Select, fieldName: string, filterType: string, values: any[]): Where {

        if (!this.joins) {
            // TODO - will this mess up with self-joins?
            throw new Error(`No join set up for ${fieldName}`);
        }

        const join = this.joins[fieldName];
        const primaryTable = this.primaryTable;
        const primaryTableId = `${primaryTable}.id`;

        const inQuery = $in(`${join.table}.${fieldName}`, values);
        const subQuery = filterType === FILTER_TYPE.NIN ? not(inQuery) : inQuery;

        // subquery for enumerable properties
        return $in(this.getQualifiedColumn("id"), Pool.sql.select(primaryTableId).from(primaryTable)
            .leftJoin(join.through, { [primaryTableId]: `${join.through}.${primaryTable}_id` })
            .leftJoin(join.table, { [`${join.through}.${join.table}_id`]: `${join.table}.id` })
            .where(subQuery)
            .groupBy(primaryTableId)
            .having(`COUNT(DISTINCT ${join.table}.${fieldName})`, values.length));
    }
}
