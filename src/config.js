export default {
    commands: [
        'remind'
    ],
    store: 'dazeus-plugin-reminders.timers',
    no_highlight_char: '~',
    command_replace: '%%',
    min_seconds_for_repeat: 60,
    skip_first_repeat_if_within: 60, // seconds
    max_number_of_repeats: 20,
    regexes: {
        help: /^help((?:\s+in)?\s+regex(es)?)?$/im,
        unset: /^(.+?)\s+no\s+more(\s+(in\s+(.+?)|personally|here))?(\s+to\s+(.+))?$/im,
        set: /^(.+?)(\s+(in\s+(.+?)|personally|here))?\s+to\s+(.+)\s+((at|this|today|tomorrow|next)\s+(.+?)|in\s+(.+?)|every\s+(.+?)\s+(from\s+(.+?)\s+)?(to|until)\s+(.+?))((\.|!)+)?$/im,
        remind: /^(.+?)(\s+(in\s+(.+?)|personally|here))?\s+to\s+(.+)$/im,
        open: /^open(\s+here)?$/
    },
    messages: {
        unknown_str: "Sorry, I don't quite know what you mean by '{str}'.",
        unknown_command: "Sorry, I couldn't quite understand that. Use `%% help` for usage instructions.",
        output_direct: "{for}: {message} (reminder)",
        output_direct_private: "{message} (reminder)",
        output_with_for: "{for}: {message} (reminder set by {by}, {created})",
        output_without_for: "{message} (reminder set by {by}, {created})",
        not_in_channel: "Sorry, I can't send a message there. I haven't joined the channel {channel}.",
        invalid_channel: "That does not appear to be a valid IRC channel name.",
        invalid_nick: "I can't send a message to that person.",
        invalid_range: "The end is before the start. I'm afraid that's not possible in this universe.",
        past_date: "I'm not a time traveler.",
        very_fast_repeat: "Whoah, let's do a little less repeating of this message shall we?",
        too_many_repeates: "You are only allowed to create repeated reminders with less than {repeats} repeats.",
        unknown_error: "Unknown error. Which shouldn't really happen. But it did. But did it though?",
        reminders_open: "There are {count} open reminders.",
        reminder_set: "Alright, I will remind in {dates}",
        reminder_unset: "Removed {count} reminders.",
        sending_help: "Alright, sending you the help.",
        sending_help_regex: "Alright, sending you the help for haxxors.",
        help: [
            "The %% command is used to create automatic reminders. They should not be regarded as reliable in any way.",
            "To create a new reminder use `%% <who> to <message>`. This will however send the reminder right away.",
            "To create a reminder at a specific time you can use a number of formats:",
            "- You can create a reminder with an interval from the current time: `%% John to wash the dishes in 20 minutes` (the keyword here is 'in').",
            "- You can create a reminder at a specific time using: `%% me to wash the dishes at 20:00` (the keyword here is 'at').",
            "- Some alternative formats include: `%% me to wash the dishes tomorrow at 13:00`, `%% Jane to wash the dishes next thursday`.",
            "- You can also set a repeated (some limits are applied) reminder using: `%% me to wash the dishes every 10 minutes until 20:00`.",
            "- Repeated reminders can also be run in between two times: `%% John to wash the dishes every day from monday to friday`.",
            "- You can also send a reminder to a specific channel: `%% me in #example to wash the dishes next friday`.",
            "- You can also send a reminder in a query chat: `%% me personally to wash the dishes in 1 week`.",
            "You can cancel all your reminders in the current channel by using `%% me no more` or `%% John no more` for another person.",
            "You can also remove only reminders with a specific message using `%% me no more to wash the dishes`"
        ]
    }
};
