"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RiskType;
(function (RiskType) {
    RiskType[RiskType["Operational"] = 0] = "Operational";
    RiskType[RiskType["Budget"] = 1] = "Budget";
    RiskType[RiskType["Schedule"] = 2] = "Schedule";
    RiskType[RiskType["Technical"] = 3] = "Technical";
    RiskType[RiskType["Resource"] = 4] = "Resource"; // Resource risk occurs due to improper management of a company’s resources such as its staff, budget, etc.
})(RiskType || (RiskType = {}));
// See https://www.wallstreetmojo.com/risk-categories/#h-top-15-risk-categories
exports.default = RiskType;
