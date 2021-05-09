module.exports = function (req, res, next) {
    req.query.limit = req.query.limit ? req.query.limit : 8;
    req.query.page = req.query.page ? req.query.page : 1;

    const sortBy = req.query.sort ? req.query.sort : "name";
    const orderBy = req.query.order ? req.query.order : "asc";
    const sortParam = {};
    sortParam[sortBy] = orderBy;
    req.query.sort = sortParam;

    next();
};
