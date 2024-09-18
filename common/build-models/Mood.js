"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERY_BAD_MOOD = exports.BAD_MOOD = exports.toString = void 0;
var Mood;
(function (Mood) {
    Mood[Mood["Neg2"] = -2] = "Neg2";
    Mood[Mood["Neg1"] = -1] = "Neg1";
    Mood[Mood["Neutral"] = 0] = "Neutral";
    Mood[Mood["Plus1"] = 1] = "Plus1";
    Mood[Mood["Plus2"] = 2] = "Plus2";
})(Mood || (Mood = {}));
function toString(mood) {
    switch (mood) {
        case Mood.Neg2:
            return {
                name: 'Demoralized',
                description: 'You feel like you are stuck in a project with little progress, and unable to make significant contributions'
            };
        case Mood.Neg1:
            return {
                name: 'Concerned',
                description: "You may feel anxious, worried or nervous about the project's progress, deadlines, or your own ability to meet expectations"
            };
        case Mood.Neutral:
            return {
                name: 'Neutral',
                description: 'You may not have particlarly positive or negative feelings about the project, but feel that you are making distinct progress'
            };
        case Mood.Plus1:
            return {
                name: 'Motivated',
                description: 'You feel optimistic and motivated about the project, perhaps because you are making progress or achieving milestones'
            };
        case Mood.Plus2:
            return {
                name: 'Enthusiastic',
                description: 'You feel enthusiastic and energized about the project, perhaps because you have accomplished something significant or are working on an exciting new feature'
            };
    }
    return { name: '', description: '' };
}
exports.toString = toString;
exports.BAD_MOOD = -0.5;
exports.VERY_BAD_MOOD = -1;
exports.default = Mood;
