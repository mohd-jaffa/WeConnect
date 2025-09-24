const dayjs = require("dayjs");

const utc = require("dayjs/plugin/utc");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const timezone = require("dayjs/plugin/timezone");
const duration = require("dayjs/plugin/duration");

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(timezone);
dayjs.extend(duration);

module.exports = dayjs;
