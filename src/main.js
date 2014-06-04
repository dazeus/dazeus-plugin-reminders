import config from "./config";
module dazeus from "dazeus";
module util from "./util";
import matcher from "./matcher";
module output from "./output";
module moment from "moment";
import {strings_to_dates, timers_for_stringify} from "./store";
import "sugar";

// lets parse command line args
var argv = dazeus.optimist().argv;
dazeus.help(argv);
var options = dazeus.optionsFromArgv(argv);

var client = dazeus.connect(options, () => {
    client.getProperty(config.store, (result) => {
        var timers = [];

        // restore timers from storage
        var old_timers;
        if (!result.value) {
            client.setProperty(config.store, JSON.stringify([]));
            old_timers = [];
        } else {
            old_timers = strings_to_dates(JSON.parse(result.value));
        }

        // set a timer to run
        var setTimer = (timer) => {
            if (!timer.date.isFuture()) {
                executeTimer(timer);
            } else {
                var now = Date.create();
                var diff = timer.date.getTime() - now.getTime();
                if (diff > 0x7FFFFFFF) {
                    timer.timeout = setTimeout(() => { setTimer(timer); }, 0x7FFFFFFF);
                } else {
                    timer.timeout = setTimeout(() => { executeTimer(timer); }, diff);
                }
            }
        };

        // run the actual timer message
        var executeTimer = (timer) => {
            var msg;
            var vars = {
                for: timer.for,
                message: timer.message,
                by: util.nohl(timer.by),
                created: moment(timer.created).fromNow()
            };
            if (timer.private) {
                msg = config.messages.output_without_for.assign(vars);
            } else {
                msg = config.messages.output_with_for.assign(vars);
            }
            client.message(timer.in[0], timer.in[1], msg);
            removeTimer(timer);
        };

        // add a timer to the list of timers
        var addTimer = (timer) => {
            timers.push(timer);

            client.setProperty(config.store, JSON.stringify(timers_for_stringify(timers)));
            setTimer(timer);
        };

        // remove a timer from the list of timers
        var removeTimer = (timer) => {
            var idx = timers.indexOf(timer);
            clearTimeout(timer.timeout);
            timers.splice(idx, 1);
            client.setProperty(config.store, JSON.stringify(timers_for_stringify(timers)));
        };

        // remove all timers that match the given data
        var removeMatchingTimer = (data) => {
            var timers_removed = 0;
            for (var i = timers.length - 1; i >= 0; i -= 1) {
                var timer = timers[i];
                var matches = 0;
                var checks = 0;

                checks += 1;
                if (data.message === undefined || data.message === timer.message) {
                    matches += 1;
                }

                checks += 1;
                if (data.for === timer.for) {
                    matches += 1;
                }

                checks += 1;
                if (data.network === timer.in[0] && data.channel === timer.in[1]) {
                    matches += 1;
                }

                if (checks === matches) {
                    removeTimer(timer);
                    timers_removed += 1;
                }
            }
            return timers_removed;
        };

        // the command runner
        var runner = (network, user, channel, execCmd, args, ...rest) => {
            client.nick(network, (nick) => {
                var is_query = channel === nick.nick;
                var command = util.fix(matcher(args), user, channel, is_query);
                var responder = output.responder_for(client, network, channel, user, execCmd);

                if (command.error) {
                    responder(command.error, false);
                } else {
                    command.network = network;
                    command.by = user;

                    if (command.command === 'remind') {
                        output.remind_now(client, network, command);
                    } else if (command.command === 'unset') {
                        output.unset(client, command, responder, removeMatchingTimer);
                    } else if (command.command === 'set') {
                        output.set(client, command, responder, addTimer);
                    } else if (command.command === 'help') {
                        output.help(command, responder);
                    } else if (command.command === 'open') {
                        command.channel = channel;
                        output.open(command, responder, timers);
                    } else if (command.command === 'debug') {
                        command.network = network;
                        command.channel = channel;
                        command.user = user;
                        output.debug(command, responder, timers, removeTimer);
                    } else {
                        responder(config.messages.unknown_error);
                    }
                }
            });
        };

        // for all specified commands, bind the runner
        for (var c of config.commands) {
            client.onCommand(c, runner);
        }

        // add timers from previous runs in storage
        for (var o of old_timers) {
            addTimer(o);
        }
        old_timers = [];
    });
});
