// import riskWeights from "./weights.json"

import ProjectStatus from "common/build-models/ProjectStatus";
import {SavedEvaluation} from "../../../models/schemas";

export default class RiskMetric {
  private static nProjects = 0;
  private static MIN_PROJECTS = 5;
  private static weightMin = 0;
  private static weightMax = 1;

  // protected static weights = riskWeights;
  // FIXME: edit tsconfig.json to play nicely with JSON imports
   public static weights = {
    budgetUsage: 0.5,
    schedulePerformanceIndex: 1,
    costPerformanceIndex: 0.8,
    probabilityExceedTimeFrame: 0.5,
    missingSkillCoverage: 0.8,
    workerUtilization: 0.4,
    testCoverage: 0.2,
    taskDurationError: 0.3,
  };

  protected static weightsBase = {
    budgetUsage: 0.5,
    schedulePerformanceIndex: 1,
    costPerformanceIndex: 0.8,
    probabilityExceedTimeFrame: 0.5,
    missingSkillCoverage: 0.8,
    workerUtilization: 0.4,
    testCoverage: 0.2,
    taskDurationError: 0.3,
  };

  // NOTE: When not 100th project, projectWeights are not used.

  //makes sure value is between the max and min of weights
  public static constrainWeight(num: number): number {
    if (num < this.weightMin) return this.weightMin;
    if (num > this.weightMax) return this.weightMax;
    return num;
  }

  public static async generateProjectWeights() {
    const w = RiskMetric.noisyWeights(); // 2nd half of your function
    const numComplete = await SavedEvaluation.countDocuments({ status: { $ne: ProjectStatus.InProgress }}).exec();
    console.log("Num projects", numComplete, "MINPROJECTS", RiskMetric.MIN_PROJECTS, numComplete % RiskMetric.MIN_PROJECTS)
    if (
      numComplete % RiskMetric.MIN_PROJECTS === 0 &&
      numComplete > RiskMetric.MIN_PROJECTS
    ) {
      const batchData = await SavedEvaluation.aggregate()
        .sort({ lastEvaluated: -1 })
        .limit(RiskMetric.MIN_PROJECTS)
        .project({
          risk: "$breakdown.risk",
          weights: "$weights",
          status: "$status",
        })
        .match({ status: { $ne: ProjectStatus.InProgress }})
        .exec();
      const projectWeights = batchData.map((d) => {
        return [
          d.weights.budgetUsage,
          d.weights.costPerformanceIndex,
          d.weights.missingSkillCoverage,
          d.weights.probabilityExceedTimeFrame,
          d.weights.schedulePerformanceIndex,
          d.weights.taskDurationError,
          d.weights.testCoverage,
          d.weights.workerUtilization,
        ];
      });
      const finalRisks = batchData.map((d) => d.risk);
      const completions = batchData.map((d) => {
        if (d.status === ProjectStatus.Success) {
          return true
        } else {
          // Failure (since InProgress is already filtered out)
          return false
        }
      });
      console.log(projectWeights, finalRisks, completions)
      RiskMetric.updateBaseWeights(projectWeights, finalRisks, completions); // First half of your function
    }
    return w;
  }

  //params only required when number of projects hits min_project interval
  //final risks is the array of all project's risk at termination
  //completion is whether all tasks completed at termination
  public static updateBaseWeights(
    projectWeights: number[][],
    finalRisks: number[],
    completions: boolean[]
  ): void {
    const numWeights = Object.keys(this.weights).length;
    // update base, 'learning' from previous set of weights
    var accurate: number[] = [
      this.weightsBase.budgetUsage,
      this.weightsBase.costPerformanceIndex,
      this.weightsBase.missingSkillCoverage,
      this.weightsBase.probabilityExceedTimeFrame,
      this.weightsBase.schedulePerformanceIndex,
      this.weightsBase.taskDurationError,
      this.weightsBase.testCoverage,
      this.weightsBase.workerUtilization,
    ];

    //find accurate previous project 
    var numAccurate = 0;
    for (var j = 0; j < finalRisks.length; j++) {
      //check for risk estimation accuracy
      if (finalRisks[j] > 0.5 && completions[j] || finalRisks[j] < 0.5 && completions[j]) {
        numAccurate ++;
        for (var i = 0; i < numWeights; i++) {
          accurate[i] += projectWeights[j][i];
        }
      }
    }

    //take the average
    for (var i = 0; i < numWeights; i++) {
      accurate[i] = this.constrainWeight(
        accurate[i] / numAccurate
      );
    }
    //update base weights
    const updateBase: Partial<typeof RiskMetric.weights> = {
      budgetUsage: accurate[0],
      schedulePerformanceIndex: accurate[1],
      costPerformanceIndex: accurate[2],
      probabilityExceedTimeFrame: accurate[3],
      missingSkillCoverage: accurate[4],
      workerUtilization: accurate[5],
      testCoverage: accurate[6],
      taskDurationError: accurate[7],
    };
    RiskMetric.weightsBase = { ...RiskMetric.weightsBase, ...updateBase };
  }

  public static noisyWeights() {
    const update: any = {};
    const numWeights = Object.keys(this.weights).length;
    // update weights with noise
    var weightNoise: number[] = new Array(numWeights);
    //for (const metric of Object.keys(RiskMetric.weights)) {
    for (var i = 0; i < numWeights; i++) {
      // noise decreases with more projects (more data to learn from)
      weightNoise[i] = (Math.random() - 0.5) / (this.nProjects + 1);
    }

    //idk how to make this into a loop :D Adds the noise
    update.budgetUsage = this.constrainWeight(
      this.weightsBase.budgetUsage + weightNoise[0]
    );
    update.costPerformanceIndex = this.constrainWeight(
      this.weightsBase.costPerformanceIndex + weightNoise[1]
    );
    update.missingSkillCoverage = this.constrainWeight(
      this.weightsBase.missingSkillCoverage + weightNoise[2]
    );
    update.probabilityExceedTimeFrame = this.constrainWeight(
      this.weightsBase.probabilityExceedTimeFrame + weightNoise[3]
    );
    update.schedulePerformanceIndex = this.constrainWeight(
      this.weightsBase.schedulePerformanceIndex + weightNoise[4]
    );
    update.taskDurationError = this.constrainWeight(
      this.weightsBase.taskDurationError + weightNoise[5]
    );
    update.testCoverage = this.constrainWeight(
      this.weightsBase.testCoverage + weightNoise[6]
    );
    update.workerUtilization = this.constrainWeight(
      this.weightsBase.workerUtilization + weightNoise[7]
    );

    return update;
  }

  //we'll need to store the weights in the DB when they are updated.

  /**
   * Updates risk metric weights
   * @param updates Update object with new weight values
   * @example RiskMetric.updateWeights({ schedulePerformanceIndex: 2.6 })
   *
   */
  public static updateWeights(
    updates: Partial<typeof RiskMetric.weights>
  ): void {
    RiskMetric.weights = { ...RiskMetric.weights, ...updates };
  }

  constructor(
    public name: string,
    public description: string,
    public value: number,
    public weight: number,
    public minVal: number,
    public maxVal: number
  ) {}

  public static weightedSum(metrics: RiskMetric[]) {
    let totalWeights = 0;
    const weightedTotal = metrics.reduce((sum: number, metric: RiskMetric) => {
      const norm = metric.normalize();

      console.log(`+ ${metric.weight} * ${norm} [${metric.name}]`);
      totalWeights += metric.weight;
      return sum + metric.weight * norm;
    }, 0);

    return weightedTotal / totalWeights;
  }

  public normalize() {
    if (this.value > this.maxVal || this.value < this.minVal) {
      throw Error(
        `Value ${this.value} for metric ${this.name} is out of valid range [${this.minVal},${this.maxVal}]`
      );
    } else {
      return (this.value - this.minVal) / (this.maxVal - this.minVal);
    }
  }
}

class NormalizedMetric extends RiskMetric {
  constructor(
    public name: string,
    public description: string,
    public value: number,
    public weight: number
  ) {
    super(name, description, value, weight, 0, 1);
  }
}

class PerformanceIndex extends RiskMetric {
  constructor(
    public name: string,
    public description: string,
    public value: number,
    public weight: number
  ) {
    super(name, description, value, weight, Number.MIN_VALUE, Number.MAX_VALUE);
  }

  public normalize() {
    if (this.value > 0) {
      // Metric indicates on cost/schedule
      return 0;
    } else {
      // Use sigmoid function upper bound to 1
      return 2 / (1 + Math.exp(this.value)) - 1;
    }
  }
}

export class BudgetUsage extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Budget Usage",
      "Fraction of project budget used across all task estimated costs",
      value,
      weight
    );
  }
}

export class SchedulePerformanceIndex extends RiskMetric {
  constructor(public value: number, weight: number) {
    super(
      "Schedule Performance Index",
      "Ratio of the project's current progress compared to its expected progress based on initial time estimations",
      value,
      weight,
      0,
      0
    );
  }

  public normalize() {
    if (this.value < 1) {
      return -1 * this.value ** 2 + 1;
    } else {
      // On schedule
      return 0;
    }
  }
}

export class CostPerformanceIndex extends PerformanceIndex {
  constructor(public value: number, weight: number) {
    super(
      "Cost Performance Index",
      "Project's cost efficiency, the ratio of current total cost to expected total cost based on task cost estimations",
      value,
      weight
    );
  }
}

export class ProbabilityExceedTimeFrame extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Probability of Exceeding Time Frame",
      "Probablity of the project completing after the given time frame. Considers task duration estimations",
      value,
      weight
    );
  }
}

export class StructuralComplexity extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Structural Complexity",
      "Measure of how complicated the dependency graph of the project is, accounting for skill and developer requirements",
      value,
      weight
    );
    if (value > 1) {
      this.value = 0.9
    }
    if (value < 0) {
      this.value = 0.1
    }
  }
}


export class CommitFrequency extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Commit Frequency",
      "Represents a decreasing trend in commit frequency",
      value,
      weight
    );
  }
}

export class MissingSkillCoverage extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Missing Skills",
      "Percentage of skills required by project tasks but not covered by any developer on the team",
      value,
      weight
    );
  }
}

export class WorkerUtilization extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Worker Utilization",
      "Percentage of developer's total working hours spent on project tasks. Accounts for developers working Full-Time or Part-Time",
      value,
      weight
    );
  }
}

export class TestCoverage extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Test Coverage",
      "Percent of completed tasks without complete testing",
      value,
      weight
    );
  }
}

export class AvgTaskDurationError extends NormalizedMetric {
  constructor(public value: number, weight: number) {
    super(
      "Task Time Estimate Error",
      "Average percentage difference between late task estimated duration and actual durations. Bounded to 100%",
      value,
      weight
    );
  }
}

export class ScopeCreep extends NormalizedMetric {
  constructor(public value: number, weight: number, public mean: number) {
    super(
      "Scope Creep Risk",
      "",
      value,
      weight
    )
    this.description = `Likeliness of failure due to adding additional features or new requirements after the initial stages of the project. Previously failed projects added ${this.mean} new requirements during its lifetime`
  }
}
