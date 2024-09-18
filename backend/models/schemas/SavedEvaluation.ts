import {model, Schema, Types} from "mongoose";
import RiskMetric from "../../services/risk/metrics/RiskMetric";
import Risk from "../../services/risk/Risk/Risk";

export interface ISavedEvaluation {
  project: Types.ObjectId;
  breakdown: {
    metrics: {
      name: string;
      description: string;
      value: number;
    }[];
    risk: number;
  };
  suggestions: Risk[];
  lastEvaluated: Date;
  weights: typeof RiskMetric.weights
  status: number;
  numTasksAdded: number;
}

const SavedEvaluation = new Schema<ISavedEvaluation>({
  project: {
    type: Schema.Types.ObjectId, ref: "Project"
  },
  breakdown: Schema.Types.Mixed,
  suggestions: [Schema.Types.Mixed],
  lastEvaluated: { type: Date, default: Date.now },
  status: { type: Number },
  weights: {
    budgetUsage: Number,
    schedulePerformanceIndex: Number,
    costPerformanceIndex: Number,
    probabilityExceedTimeFrame: Number,
    missingSkillCoverage: Number,
    workerUtilization: Number,
    testCoverage: Number,
    taskDurationError: Number
  },
  numTasksAdded: { type: Number, default: 0 }
});

export default model<ISavedEvaluation>("SavedEvaluation", SavedEvaluation);
