import "sugar";
import config from "./config";
module util from "./util";

// create a responder for error messages and response messages
export var responder_for = function (client, network, channel, user, execCmd) {
    return (msg, notice = false) => {
        client.highlightCharacter((char) => {
            var cmdPrefix = char + execCmd;
            var regex = new RegExp(util.escape_reg_exp(config.command_replace), 'g');
            msg = msg.replace(regex, cmdPrefix);
            if (notice) {
                client.notice(network, user, msg);
            } else {
                client.reply(network, channel, user, msg, false);
            }
        });
    };
};

// send a direct reminder
export var remind_now = function (client, network, cmd) {
    var msg;
    if (cmd.private) {
        msg = config.messages.output_direct_private.assign(cmd);
    } else {
        msg = config.messages.output_direct.assign(cmd);
    }
    client.message(network, cmd.channel, msg);
};

// show help message
export var help = function (cmd, reply) {
    if (cmd.regex) {
        reply(config.messages.sending_help_regex);
        for (var regex of Object.keys(config.regexes)) {
            var r = config.regexes[regex].toString();
            reply(regex[0].toUpperCase() + regex.slice(1) + ' matched by ' + r, true);
        }
    } else {
        reply(config.messages.sending_help);
        for (var msg of config.messages.help) {
            reply(msg, true);
        }
    }
};

export var set = function (client, cmd, reply, add_timer) {
    var set_timers = function () {
        for (var time of cmd.time) {
            var timer = {
                message: cmd.message,
                for: cmd.for,
                in: [cmd.network, cmd.channel],
                private: cmd.private,
                date: time,
                by: cmd.by,
                created: Date.create()
            };
            add_timer(timer);
        }

        var dates;
        if (cmd.time.length > 3) {
            dates = cmd.time.slice(0, 2).map((d) => d.relative()).join(', ') + ', ..., ' + cmd.time[cmd.time.length - 1].relative();
        } else {
            dates = cmd.time.map((d) => d.relative()).join(', ');
        }

        reply(config.messages.reminder_set.assign({
            dates: dates
        }));
    };

    if (util.is_valid_channel_name(cmd.channel)) {
        util.is_bot_in_channel(client, cmd.network, cmd.channel, function (is_in_channel) {
            if (is_in_channel) {
                set_timers();
            } else {
                reply(config.messages.not_in_channel.assign({channel: cmd.channel}));
            }
        });
    } else {
        set_timers();
    }

};

export var unset = function (client, cmd, reply, remove_matching_timer) {
    var count = remove_matching_timer(cmd);
    reply(config.messages.reminder_unset.assign({count: count}));
};

export var open = function (cmd, reply, timers) {
    var filter;
    if (cmd.channel_only) {
        filter = (t) => t.in[0] === cmd.network && t.in[1] === cmd.channel;
    } else {
        filter = (t) => t.in[0] === cmd.network;
    }
    reply(config.messages.reminders_open.assign({count: timers.filter(filter).length}));
};
