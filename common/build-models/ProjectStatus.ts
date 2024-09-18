enum ProjectStatus {
    Success,    // < Project time frame and all tasks are complete
    InProgress, // < Project time frame and exist incomplete task
    Failure,    // > Project time frame and exist incomplete task (can later complete all tasks)
}

export default ProjectStatus;