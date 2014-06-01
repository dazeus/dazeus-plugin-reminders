import config from './config';

export default function (command) {
    var result;
    if (result = config.regexes.help.exec(command)) {
        return {
            command: 'help',
            regex: result[1] !== undefined
        };
    } else if (result = config.regexes.unset.exec(command)) {
        return {
            command: 'unset',
            for: result[1],
            channel: result[4],
            private: result[3] === config.messages.personally,
            message: result[6]
        };
    } else if (result = config.regexes.set.exec(command)) {
        var time = {};
        if (result[7]) {
            time.type = 'at';
            time.when = result[8];
            if (result[7] !== 'at') {
                time.when = "{prefix} {when}".assign({prefix: result[7], when: time.when});
            }
        } else if (result[9]) {
            time.type = 'in';
            time.when = result[9];
        } else {
            time.type = 'every';
            time.every = result[10];
            time.start = result[12] ? result[12] : 'now';
            time.end = result[14];
        }

        return {
            command: 'set',
            message: result[5],
            for: result[1],
            private: result[3] === config.messages.personally,
            channel: result[4],
            time: time
        };
    } else if (result = config.regexes.remind.exec(command)) {
        return {
            command: 'remind',
            message: result[5],
            for: result[1],
            private: result[3] === config.messages.personally,
            channel: result[4]
        };
    } else if (result = config.regexes.open.exec(command)) {
        return {
            command: 'open',
            channel_only: result[1] !== undefined
        };
    } else {
        return {
            command: false,
            error: config.messages.unknown_command
        };
    }
};
