type TimeUnit = "seconds" | "minutes" | "hours" | "days";
type Collection<T> = T[];

function infer_time_unit(time_seconds_arr: Collection<number>): TimeUnit {
    if (time_seconds_arr.length === 0) {
        return "hours";
    }
    const max_time_seconds = Math.max(...time_seconds_arr);
    if (max_time_seconds <= 60 * 2) {
        return "seconds";
    } else if (max_time_seconds <= 60 * 60 * 2) {
        return "minutes";
    } else if (max_time_seconds <= 24 * 60 * 60 * 2) {
        return "hours";
    } else {
        return "days";
    }
}

function scale_time_units(time_seconds_arr: Collection<number>, unit: TimeUnit): Collection<number> {
    if (unit === "minutes") {
        return time_seconds_arr.map(x => x / 60);
    } else if (unit === "hours") {
        return time_seconds_arr.map(x => x / (60 * 60));
    } else if (unit === "days") {
        return time_seconds_arr.map(x => x / (24 * 60 * 60));
    }
    return time_seconds_arr;
}
