"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Success"] = 0] = "Success";
    ProjectStatus[ProjectStatus["InProgress"] = 1] = "InProgress";
    ProjectStatus[ProjectStatus["Failure"] = 2] = "Failure";
})(ProjectStatus || (ProjectStatus = {}));
exports.default = ProjectStatus;
