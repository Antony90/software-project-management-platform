import {DeveloperMood} from "common/build-models/Project";
import React from "react";
import {MoodGraph} from "./MoodGraph";
import {User} from "../../Models/DatabaseObjects/User";

export function MoodOverview({projectMood, developers, projectManagerID}: {projectMood:DeveloperMood, developers: User[], projectManagerID: string }) {
    return (
        <MoodGraph moodData={projectMood} developers={developers} projectManagerID={projectManagerID} ></MoodGraph>
    );
}
