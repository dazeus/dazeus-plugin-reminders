import "sugar";
import config from "./config";
module moment from "moment";

// clean up the matched content from the command
export var fix = function (cmd, requester, channel, is_query) {
    if (cmd.command === 'set' || cmd.command === 'remind' || cmd.command === 'unset') {

        // replace me with the requester name
        if (cmd.for === 'me') {
            cmd.for = requester;
        }

        // if this is a query, the reminder is not for the requester and the channel is unknown
        // then it probably is a private reminder for that person
        if (is_query && cmd.for !== requester && (cmd.channel === null || cmd.channel === 'here')) {
            cmd.channel = cmd.for;
            cmd.private = true;

        // if it is a private request, set the response channel to that person
        } else if (cmd.private) {
            cmd.channel = cmd.for;

        // if the channel has not been set, set it to the current channel
        } else if (cmd.channel === null || cmd.channel === undefined || cmd.channel === 'here') {
            if (is_query) {
                cmd.channel = requester;
            } else {
                cmd.channel = channel;
            }
        }

        // if channel and requester are the same, then this was supposed to be a private request
        if (cmd.channel === requester) {
            cmd.private = true;
        }

        // whoops I cannot message to this channel
        if (!is_valid_channel_name(cmd.channel) && !is_valid_nick_name(cmd.channel)) {
            if (cmd.private) {
                cmd.error = config.messages.invalid_nick;
            } else {
                cmd.error = config.messages.invalid_channel;
            }
        }
    }

    // let's resolve time
    if (cmd.command === 'set') {
        cmd = resolve_set_time(cmd);
    }
    return cmd;
};

// resolve the time variable to a list of time slots in which the reminder should be given
var resolve_set_time = function (cmd) {
    // a repeated reminder
    if (cmd.time.type === 'every') {
        var time = str_to_seconds(cmd.time.every);
        if (time < 0) {
            cmd.error = config.messages.unknown_str.assign({str: cmd.time.every});
        } else {
            cmd.time.every = time;
            if (cmd.time.every < config.min_seconds_for_repeat) {
                cmd.error = config.messages.very_fast_repeat;
            }
        }

        var start = get_date(cmd.time.start);
        if (!start.isValid()) {
            cmd.error = config.messages.unknown_str.assign({str: cmd.time.start});
        } else {
            cmd.time.start = start;
        }

        var end = get_date(cmd.time.end);
        if (!end.isValid()) {
            cmd.error = config.messages.unknown_str.assign({str: cmd.time.end});
        } else {
            cmd.time.end = end;
        }

        if (!cmd.error) {
            if (cmd.time.start.isAfter(cmd.time.end)) {
                cmd.error = config.messages.invalid_range;
            } else {
                // a valid range has been found!
                var current = cmd.time.start;

                if (current.secondsSince(Date.create()) < config.skip_first_repeat_if_within) {
                    current = current.addSeconds(cmd.time.every);
                }
                var slots = [];
                while (!current.isAfter(cmd.time.end)) {

                    // whoah there, time traveler!
                    if (!current.isFuture()) {
                        cmd.error = config.past_date;
                    }
                    slots.push(current);
                    current = Date.create(current).addSeconds(cmd.time.every);
                    if (slots.length > config.max_number_of_repeats) {
                        break;
                    }
                }

                if (slots.length > config.max_number_of_repeats) {
                    cmd.error = config.messages.too_many_repeates.assign({
                        repeats: config.max_number_of_repeats
                    });
                } else {
                    cmd.time = slots;
                }
            }
        }
    // at a specific time
    } else if (cmd.time.type === 'at') {
        var date = get_date(cmd.time.when);
        if (!date.isValid()) {
            cmd.error = config.messages.unknown_str.assign({str: cmd.time.when});
        } else {
            cmd.time = [date];
            if (!date.isFuture()) {
                cmd.error = config.messages.past_date;
            }
        }
    // in some duration of time
    } else if (cmd.time.type === 'in') {
        var date = str_to_date(cmd.time.when);
        if (!date.isValid()) {
            cmd.error = config.messages.unknown_str.assign({str: cmd.time.when});
        } else {
            cmd.time = [date];
            if (!date.isFuture()) {
                cmd.error = config.messages.past_date;
            }
        }
    }
    return cmd;
};

// transform a string to a date
export var get_date = function (str) {
    return Date.future(str.replace(/\bnoon\b/, '12:00').replace(/\bmidnight\b/, '00:00'));
};

// return a boolean indicating the given string is probably a valid IRC channel
export var is_valid_channel_name = function (chan) {
    return typeof chan === 'string' &&
        chan.length > 1 &&
        chan.length <= 51 &&
        !(/\s/.test(chan)) &&
        ['&', '#', '+', '!'].indexOf(chan[0]) !== -1
    ;
};

// return a boolean indicating the given string is probably a valid IRC name
export var is_valid_nick_name = function (str) {
    return /^[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*$/i.test(str);
};

// calls the callback with a boolean indicating if the bot has joined the channel or not
export var is_bot_in_channel = function (client, network, channel, callback) {
    client.channels(network, (channels) => {
        callback(channels.channels.indexOf(channel) !== -1);
    });
};

// alternatives and token names allowed
var token_names = {
    s: 'second',
    sec: 'second',
    secs: 'second',
    second: 'second',
    seconds: 'second',
    min: 'minute',
    mins: 'minute',
    minute: 'minute',
    minutes: 'minutes',
    h: 'hour',
    hr: 'hour',
    hour: 'hour',
    hours: 'hour',
    d: 'day',
    dy: 'day',
    day: 'day',
    days: 'day',
    w: 'week',
    wk: 'week',
    week: 'week',
    weeks: 'week',
    mon: 'month',
    month: 'month',
    months: 'month',
    y: 'year',
    yr: 'year',
    yrs: 'year',
    year: 'year',
    years: 'year'
};

// return -1 if it is not a valid integer in {0, 1, 2, ...}, or the integer otherwise
var get_valid_nat_num = function (str) {
    var n = ~~Number(str);
    if (String(n) === str && n >= 0) {
        return n;
    }
    return -1;
};

// returns an array of (int, str) for unspaced variants of time lengths, such as: '5min' and '10s'
// also detects valid single names such as 'year' and 'months'.
var split_named_part = function (str, disallow_number = false) {
    var match = /^[a-z]+$/.exec(str);
    if (!match) {
        if (disallow_number) {
            return [null, null];
        } else if (match = /(\+?(\d+))([a-z]+)$/.exec(str)) {
            var num, unit;
            [num, unit] = [parseInt(match[2], 10), match[3]];
            if (undefined === token_names[unit]) {
                return [null, null];
            } else {
                return [num, token_names[unit]];
            }
        } else {
            return [null, null];
        }
    } else {
        if (undefined === token_names[str]) {
            return [null, null];
        } else {
            return [1, token_names[str]];
        }
    }
};

// try to transform a string in the form of '5 minutes and 2d' to a number of seconds
export var str_to_seconds = function (str) {
    if (typeof str !== 'string') {
        return -1;
    }

    var parts = str.toLowerCase().trim().split(/\s+/);
    var now = moment();
    var time = moment(now);

    var token = 0;
    var num = null;
    var type = null;
    while (token < parts.length) {
        var current = parts[token];
        if (current !== 'and') {
            if (num === null) {
                num = get_valid_nat_num(current);
                if (num < 0) {
                    [num, type] = split_named_part(current);
                    if (type !== null) {
                        time.add(num, type);
                    } else {
                        return -1;
                    }
                    num = type = null;
                }
            } else {
                var restnum;
                [restnum, type] = split_named_part(current, true);
                if (type !== null) {
                    time.add(num, type);
                } else {
                    return -1;
                }
                num = type = null;

            }
        }
        token += 1;
    }
    return time.diff(now, 'seconds');
};

// get the number of seconds and add it to the current time or return an invalid date if the seconds
// could not be parsed
export var str_to_date = function (str) {
    var seconds = str_to_seconds(str);
    if (seconds < 0) {
        return Date.create('invalid');
    } else {
        return Date.create().addSeconds(seconds);
    }
};

export var escape_reg_exp = function (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
