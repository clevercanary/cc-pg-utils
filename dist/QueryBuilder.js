"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cc_qm_1 = require("cc-qm");
var util_1 = require("util");
var Pool_1 = require("./Pool");
var eq = Pool_1.Pool.sql.eq;
var notEq = Pool_1.Pool.sql.notEq;
var $in = Pool_1.Pool.sql.in;
var or = Pool_1.Pool.sql.or;
var not = Pool_1.Pool.sql.not;
var select = Pool_1.Pool.sql.select;
var _ = require("lodash");
var FILTER_TYPE = {
    EQUALS: "EQUALS",
    NOT: "NOT",
    IN: "IN",
    AND: "AND",
    OR: "OR",
    NIN: "NIN"
};
var QueryBuilder = (function () {
    function QueryBuilder(primaryTable, qualifiedColumns, joins) {
        this.primaryTable = primaryTable;
        this.qualifiedColumns = qualifiedColumns;
        this.joins = joins;
        if (!this.qualifiedColumns["id"]) {
            throw new Error("Primary table " + primaryTable + " needs an 'id' qualifier");
        }
    }
    /**
     * Build Query
     *
     * @param select
     * @param qm
     */
    QueryBuilder.prototype.buildQuery = function (select, qm) {
        if (qm.isPaginated()) {
            if (!util_1.isNullOrUndefined(qm.getOffset())) {
                select.offset(qm.getOffset());
            }
            if (!util_1.isNullOrUndefined(qm.getLimit())) {
                select.limit(qm.getLimit());
            }
        }
        this.addFilters(select, qm.getFilters());
        if (qm.isSortable()) {
            this.addSorts(select, qm.getSorts());
        }
    };
    /**
     * Get table-qualified column name
     *
     * @param select
     * @param field
     * @returns {string}
     */
    QueryBuilder.prototype.getQualifiedColumn = function (field) {
        if (!this.qualifiedColumns[field]) {
            throw new Error(field + " has no table qualifier.");
        }
        return this.qualifiedColumns[field];
    };
    /**
     * Add Sort Order
     *
     * @param select
     * @param sorts
     */
    QueryBuilder.prototype.addSorts = function (select, sorts) {
        var _this = this;
        var sortArr = sorts.reduce(function (acc, sort) {
            var qualifiedField = _this.getQualifiedColumn(sort.fieldName);
            var order = sort.asc ? "ASC" : "DESC";
            acc.push(qualifiedField + " " + order);
            return acc;
        }, []);
        select.orderBy(sortArr.join(","));
    };
    /**
     * Add Filters
     *
     * @param select
     * @param filters
     */
    QueryBuilder.prototype.addFilters = function (select, filters) {
        var _this = this;
        // add conditional filters to the query, and reduce the other
        // filters by field queries on the same column need to be
        // turned into sub queries. We need to do this to check if
        // we need to construct any subqueries
        var filterByField = filters.reduce(function (acc, filter) {
            if (cc_qm_1.QueryModel.isConditionalQueryFilter(filter)) {
                // add or conditions
                select.where(_this.addConditionalFilter(filter));
                return acc;
            }
            acc[filter.fieldName] = !acc[filter.fieldName] ? [filter] : acc[filter.fieldName].concat(filter);
            return acc;
        }, {});
        // iterate through each column, processing it's filters.
        Object.keys(filterByField).forEach(function (fieldName) {
            var fieldFilters = filterByField[fieldName];
            if (fieldFilters.length === 1) {
                // if there is only one, it's just a basic filter on that column.
                return select.where(_this.buildPgFilter(fieldFilters[0]));
            }
            // group this columns filters by type
            var filterByType = _.groupBy(fieldFilters, "filterType");
            if (filterByType[FILTER_TYPE.EQUALS]) {
                // if multiple equals/not equals on the same field, we need a subquery to convert it to `IN`
                if (filterByType[FILTER_TYPE.EQUALS].length > 1) {
                    select.where(_this.buildInListSubQuery(select, fieldName, FILTER_TYPE.EQUALS, fieldFilters.map(function (f) { return f.value; })));
                }
                else {
                    select.where(_this.buildPgFilter(filterByType[FILTER_TYPE.EQUALS][0]));
                }
            }
            fieldFilters.forEach(function (filter) {
                if (filter.filterType === FILTER_TYPE.EQUALS) {
                    // skip the EQUALS filters we already processed
                    return;
                }
                return select.where(_this.buildPgFilter(filter));
            });
        });
    };
    QueryBuilder.prototype.buildPgFilter = function (filter) {
        if (cc_qm_1.QueryModel.isConditionalQueryFilter(filter)) {
            return this.addConditionalFilter(filter);
        }
        var fieldName = this.getQualifiedColumn(filter.fieldName);
        if (util_1.isNullOrUndefined(fieldName)) {
            throw new Error(filter.fieldName + " has no qualified column");
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
    };
    QueryBuilder.prototype.addConditionalFilter = function (filter) {
        var _this = this;
        if (filter.filterType === FILTER_TYPE.AND) {
            // this shouldn't ever need to happen. all "AND" queries are implicit by adding separate queries.
            // if we need to handle multiple requests on the same field, it needs to be an applied subquery.
            throw new Error("Explicit AND query isn't currently implemented");
        }
        else if (filter.filterType === FILTER_TYPE.OR) {
            var filters = filter.conditions.map(function (condition) { return _this.buildPgFilter(condition); });
            return or.apply(null, filters);
        }
        else {
            throw new Error("Invalid filter type: " + filter.filterType);
        }
    };
    QueryBuilder.prototype.buildInListSubQuery = function (select, fieldName, filterType, values) {
        if (!this.joins) {
            // TODO - will this mess up with self-joins?
            throw new Error("No join set up for " + fieldName);
        }
        var join = this.joins[fieldName];
        var primaryTable = this.primaryTable;
        var primaryTableId = primaryTable + ".id";
        var inQuery = $in(join.table + "." + fieldName, values);
        var subQuery = filterType === FILTER_TYPE.NIN ? not(inQuery) : inQuery;
        // subquery for enumerable properties
        return $in(this.getQualifiedColumn("id"), Pool_1.Pool.sql.select(primaryTableId).from(primaryTable)
            .leftJoin(join.through, (_a = {}, _a[primaryTableId] = join.through + "." + primaryTable + "_id", _a))
            .leftJoin(join.table, (_b = {}, _b[join.through + "." + join.table + "_id"] = join.table + ".id", _b))
            .where(subQuery)
            .groupBy(primaryTableId)
            .having("COUNT(DISTINCT " + join.table + "." + fieldName + ")", values.length));
        var _a, _b;
    };
    return QueryBuilder;
}());
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=QueryBuilder.js.map