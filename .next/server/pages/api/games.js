"use strict";
(() => {
var exports = {};
exports.id = 639;
exports.ids = [639];
exports.modules = {

/***/ 678:
/***/ ((module) => {

module.exports = import("pg");;

/***/ }),

/***/ 263:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "d": () => (/* binding */ pool)
/* harmony export */ });
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(678);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([pg__WEBPACK_IMPORTED_MODULE_0__]);
pg__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];

const pool = global.pool || new pg__WEBPACK_IMPORTED_MODULE_0__.Pool({
    connectionString: process.env.DATABASE_URL
});
if (false) {}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 128:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ handler)
/* harmony export */ });
/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(263);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_lib_db__WEBPACK_IMPORTED_MODULE_0__]);
_lib_db__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];

const query = async (text, values)=>(await _lib_db__WEBPACK_IMPORTED_MODULE_0__/* .pool.query */ .d.query(text, values)).rows;
async function handler(req, res) {
    const search = req.query?.search?.toString();
    if (req.method !== "GET") {
        return res.status(200).json([]);
    }
    let results = [];
    // If a number is coming in, search the appid
    if (Number.isInteger(Number(search))) {
        results.push(...await query('SELECT * FROM "Game" WHERE appid = $1', [
            Number(search), 
        ]));
    }
    if (search && search.length > 2) {
        const games = await query(`
            (
                SELECT appid, name, 1 as score
                FROM public."Game"
                WHERE name ILIKE $1 || '%'
            )
            UNION ALL
            (
                SELECT appid, name, 0.99 as score
                FROM public."Game"
                WHERE name ILIKE '%' || $1 || '%'
            )
            UNION ALL
            (
                SELECT appid, name, similarity(name, $1) as score
                FROM public."Game"
                WHERE name % $1
            )
            order by score desc, name
            limit 100;
            `, [
            search
        ]);
        results.push(...games);
    } else if (search?.length) {
        // Searching 1 or 2 chars do startswith type search
        results.push(...await query(`SELECT * FROM "Game" WHERE name ILIKE $1 || '%' LIMIT 100`, [
            search
        ]));
    }
    // If no results, just return 30 random games
    if (results.length === 0 && !search?.length) {
        results = await query('SELECT * FROM "Game" ORDER BY RANDOM() LIMIT 30');
    }
    // filter out any duplicates that may have been returned
    results = results.filter((item, index, self)=>self.findIndex((t)=>t.appid === item.appid) === index);
    return res.status(200).json(results);
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(128));
module.exports = __webpack_exports__;

})();