import "sugar";

var timer_for_stringify = function (timer) {
    return {
        message: timer.message,
        for: timer.for,
        in: [timer.in[0], timer.in[1]],
        private: timer.private,
        date: Date.create(timer.date),
        by: timer.by,
        created: Date.create(timer.created)
    };
};

export var timers_for_stringify = function (timers) {
    return timers.map((timer) => {
        return timer_for_stringify(timer);
    });
};

export var strings_to_dates = function (timers) {
    return timers.map((timer) => {
        return single_timer_strings_to_dates(timer);
    });
};

export var single_timer_strings_to_dates = function (timer) {
    timer.date = Date.create(timer.date);
    timer.created = Date.create(timer.created);
    return timer;
};
