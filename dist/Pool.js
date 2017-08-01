"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var pgsql = require("sql-bricks-postgres");
// TODO - query stream functionality implementation
var Pool = (function () {
    function Pool(config) {
        this.config = config;
        this.pool = new pg_1.Pool(config);
    }
    Object.defineProperty(Pool.prototype, "sql", {
        /**
         * Expose Sql-Bricks-Postgres methods
         *
         * @returns {Sql}
         */
        get: function () {
            return pgsql;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Pool, "sql", {
        get: function () {
            return pgsql;
        },
        enumerable: true,
        configurable: true
    });
    /**
     *
     * @param args
     * @returns {any}
     */
    Pool.prototype.query = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.pool.query.apply(this.pool, Array.from(arguments));
    };
    /**
     * Kill the connection pool
     *
     * @returns {Promise<void>}
     */
    Pool.prototype.end = function () {
        return this.pool.end();
    };
    /**
     * Pull a connection from the pool
     *
     * @returns {Promise<Client>}
     */
    Pool.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pool.connect()];
                    case 1:
                        client = _a.sent();
                        return [2 /*return*/, this.appendBricks(client)];
                }
            });
        });
    };
    /**
     * Initiate a transaction
     *
     * @param fn
     * @returns {Promise<T>}
     */
    Pool.prototype.transaction = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        client = _a.sent();
                        return [4 /*yield*/, client.query("BEGIN")];
                    case 2:
                        _a.sent();
                        this.config.debug ? console.log("\u001B[35mPostgres: \u001B[37mTRANSACTION BEGIN") : void 0;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, 8, 9]);
                        return [4 /*yield*/, fn(client)];
                    case 4:
                        result = _a.sent();
                        return [4 /*yield*/, client.query("COMMIT")];
                    case 5:
                        _a.sent();
                        this.config.debug ? console.log("\u001B[35mPostgres: \u001B[37mTRANSACTION COMMIT") : void 0;
                        return [2 /*return*/, result];
                    case 6:
                        error_1 = _a.sent();
                        return [4 /*yield*/, client.query("ROLLBACK")];
                    case 7:
                        _a.sent();
                        this.config.debug ? console.log("\u001B[35mPostgres: \u001B[37mTRANSACTION ROLLBACK") : void 0;
                        this.config.debug ? console.log(error_1) : void 0;
                        throw error_1;
                    case 8:
                        client.release();
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add Sql-Bricks Methods to client
     *
     * @param pgClient
     * @returns {Client}
     */
    Pool.prototype.appendBricks = function (pgClient) {
        var _this = this;
        this.appendInsertMethods(pgClient);
        this.appendApplyQuery(pgClient);
        this.appendCountQuery(pgClient);
        ["select", "update", "delete"].forEach(function (method) {
            _this.appendStatementMethods(pgClient, method);
        });
        // Monkey-patch is complete, so we need to force typecast
        return pgClient;
    };
    /**
     * Append insert Methods to client
     *
     * @param pgClient
     * @returns {Client}
     */
    Pool.prototype.appendInsertMethods = function (pgClient) {
        var client = pgClient;
        var logIt = this.logIt.bind(this);
        client.insert = function () {
            var _this = this;
            var brick = pgsql.insert.apply(pgsql, Array.from(arguments));
            brick.run = function () {
                var config = brick.toParams();
                logIt(brick);
                return _this.query(config);
            };
            brick.select = function () {
                var sel = pgsql.insert.prototype.select.apply(pgsql, Array.from(arguments));
                sel.run = brick.run;
                return sel;
            };
            return brick;
        };
        return client;
    };
    /**
     * Append applyQuery Method to client
     *
     * @param pgClient
     * @returns {Client}
     */
    Pool.prototype.appendApplyQuery = function (pgClient) {
        var _this = this;
        var client = pgClient;
        client.applyQuery = function (brick) {
            _this.logIt(brick);
            return client.query(brick.toParams());
        };
        return client;
    };
    /**
     * Append count Method to client
     *
     * @param pgClient
     * @returns {Client}
     */
    Pool.prototype.appendCountQuery = function (pgClient) {
        var _this = this;
        var client = pgClient;
        client.count = function (brick) {
            var cloned = brick.clone();
            // grab the primary table being queried from. TODO - I'm not sure if this will work consistently with composability
            var fromList = cloned._from[0].split(" ");
            var fromTable = fromList[fromList.length - 1];
            // this wipes all other select columns and forces it to be a count query.
            cloned._columns = [];
            cloned._columns.push("COUNT(DISTINCT " + fromTable + ".id)");
            // remove any sort orders that will mess with aggregate
            delete cloned._orderBy;
            _this.logIt(cloned);
            return client.query(cloned.toParams());
        };
        return client;
    };
    /**
     * Append Sql-Bricks methods for select/update/delete
     *
     * @param pgClient
     * @param method
     * @returns {Client}
     */
    Pool.prototype.appendStatementMethods = function (pgClient, method) {
        var client = pgClient;
        var logIt = this.logIt.bind(this);
        client[method] = function () {
            var brick = pgsql[method].apply(pgsql, Array.from(arguments));
            brick.run = function () {
                var config = brick.toParams();
                logIt(brick);
                return client.query(config);
            };
            return brick;
        };
        return client;
    };
    /**
     * Logger Function
     *
     * @param brick
     */
    Pool.prototype.logIt = function (brick) {
        if (this.config.debug) {
            console.log("\u001B[35mPostgres: \u001B[37m" + brick.toString());
        }
    };
    return Pool;
}());
exports.Pool = Pool;
//# sourceMappingURL=Pool.js.map