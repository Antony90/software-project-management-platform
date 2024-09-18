import {Types} from "mongoose";
import erf from "math-erf";

import {clean} from "../db.service";

import Project from "../../models/Project";
import ProjectStatistics from "../../models/ProjectStatistics";
import TopLevelTask from "../../models/TopLevelTask";
import ProjectStatus from "common/build-models/ProjectStatus";
import {UserTaskData} from "../../models/User";

import {ProjectCollection, SavedEvaluation} from "../../models/schemas";
import {ProjectDoc} from "../../models/schemas/Project";

import RiskMetric, {
  AvgTaskDurationError,
  BudgetUsage, CommitFrequency,
  CostPerformanceIndex,
  MissingSkillCoverage,
  ProbabilityExceedTimeFrame,
  SchedulePerformanceIndex,
  ScopeCreep,
  StructuralComplexity,
  TestCoverage,
  WorkerUtilization,
} from "./metrics/RiskMetric";

import Risk from "./Risk/Risk";
import UnevenWorkDistribution from "./Risk/UnevenWorkDistribution";
import TaskExceedEstimatedCost from "./Risk/TaskExceedEstimatedCost";
import DelayedTaskExceedSlack from "./Risk/DelayedTaskExceedSlack";
import {BAD_MOOD} from "common/build-models/Mood";
import LowDeveloperMood from "./Risk/LowDeveloperMood";
import SharedTaskLowMood from "./Risk/SharedTaskLowMood";
import SkillMismatch from "./Risk/SkillMismatch";
import TaskMissingDevelopers from "./Risk/TaskMissingDevelopers";
import MissingSkill from "./Risk/MissingSkill";
import MostExpensiveTask from "./Risk/MostExpensiveTask";
import {ISavedEvaluation} from "../../models/schemas/SavedEvaluation";
import { Commit } from "../../models/Commit";
import { GithubService } from "../github/GithubService";

type ProjectTimeResult = {
  estimatedTime: number;
  stdDev: number;
};

export default class ProjectEvaluator {
  constructor(
    public project: Project,
    public stats: ProjectStatistics,
    public weights: typeof RiskMetric.weights,
    public numTasksAdded: number,
    public riskSuggestions: Risk[] = [] as Risk[],
  ) {}

  public static async findById(
    projectID: string | Types.ObjectId,
    userID: string | undefined,
    refresh: boolean
  ) {
    // Find existing risk evaluation. If not exists, project doesn't exist
    const evalDoc = await SavedEvaluation.findOne({ project: projectID })
      .select({ weights: 0 })
      .populate<{ project: { developers: Types.ObjectId[] } }>({
        path: "project",
        select: "developers"
      })
      .exec();
      
    // Project doesn't exist
    if (evalDoc === null) return undefined;
    const isContributor = evalDoc.project.developers.map(oID=>oID.toString()).includes(userID||'')
    if (!isContributor) return undefined;

    // If evaluation is >1 day old, re-evaluate before returning
    let evaluation: any;
    if (
      refresh ||
      Date.now() - evalDoc.lastEvaluated.getTime() >
      (1000 * 3600 * 24)
    ) {
      console.log("Last evaluated >1 day ago OR refresh");
      // If not evaluated within 24 hours, re-evaluate risk
      evaluation = await this.evaluate(projectID);
    } else {
      console.log("Evaluated <1 day ago");
      // Otherwise take existing eval and populate with project doc
      evaluation = await evalDoc.populate<{ project: ProjectDoc }>(
        "project"
      );
    }
    console.log("Mood:", evaluation.project.mood)

    // Exclude risk breakdown for non project managers
    if (evaluation.project.projectManager.toString() === userID) {
      return clean(evaluation) as object;
    } else {
      // Remove risk breakdown, suggestions and mood
      const project = {...evaluation.project};
      delete project.mood;
      return clean({ project: evaluation.project }) as object;
    }
  }

  public static async evaluate(projectID: string | Types.ObjectId) {
    const projectDoc = await Project.findById(projectID);
    const project = Project.docToObj(projectDoc);
    const stats = await ProjectStatistics.findById(projectID);

    // Get weights used in previous evaluation. If no previous doc exists, generate them
    const { weights, numTasksAdded } = await SavedEvaluation.findOne({ project: projectID })
    .exec()
    .then(async (savedEval) => {
      if (savedEval === null) {
        return { weights: await RiskMetric.generateProjectWeights(), numTasksAdded: 0 }
      } else {
        console.log("Got weights", savedEval.weights)
        return { weights: savedEval.weights, numTasksAdded: savedEval.numTasksAdded }
      }
    });

    const evaluator = new ProjectEvaluator(project, stats, weights, numTasksAdded);
    // Evaluate each metric and calcualte weighted average
    const breakdown = await evaluator.getRiskMetricBreakdown();
    // Generate applicable risk suggestions and resolutions
    const suggestions = evaluator.generateSuggestions();
    // Check whether the project is in progress, complete or failed
    const status = evaluator.getProjectStatus();

    console.log("Updating SavedEvaluation");
    const evalDoc = {
      project: projectID,
      breakdown,
      suggestions,
      lastEvaluated: new Date(),
      status,
      weights
    };
    await SavedEvaluation.findOneAndUpdate({ project: projectID }, evalDoc)
      .orFail()
      .exec()
      .catch(async () => {
        // Document not found, create instead
        console.log("No previous SavedEvaluation found");
        await SavedEvaluation.create(evalDoc);
        console.log("Created new SavedEvaluation");
      });
    console.log("Returning with order", project.tasks.map(t=>t.name));
    
    const result = {
      project: project.toJSON(),
      breakdown,
      suggestions,
      status,
    };
    // Update calculated start/finish times
    await ProjectCollection.findByIdAndUpdate(project._id, { $set: { tasks: result.project.tasks }});
    return result
  }

  private toProjectDays(date: Date) {
    const daysSinceStartMS = date.getTime() - this.project.startDate.getTime();
    return daysSinceStartMS / (1000 * 3600 * 24);
  }

  public async getRiskMetricBreakdown() {
    let risk: RiskMetric[];
    let projectedCompletion: number | undefined = undefined;
    if (this.project.isInitial()) {
      console.log("In initial state")
      risk = this.calcInitRisk();
    } else {
      console.log("Not in initial state")
      const v = await this.calcRisk();
      risk = v.risk;
      projectedCompletion = v.projectedCompletion
    }
    const weightedSum = RiskMetric.weightedSum(risk);
    console.log(weightedSum);

    // Sort metrics by weight, highest first - most important risks first
    return {
      metrics: risk
        .sort((a, b) => -a.weight + b.weight)
        .map((riskMetric) => ({
          name: riskMetric.name,
          description: riskMetric.description,
          value: riskMetric.normalize(),
        })),
      risk: weightedSum,
      projectedCompletion
    };
  }

  public generateSuggestions() {
    // Sort developers by assigned work hours for use in suggestions
    const developerAssginedHours = this.getDeveloperWorkHours();
    const developersByWorkHours = [...this.project.developers].sort((devA, devB) => {
      return (developerAssginedHours.get(devA)||0) - (developerAssginedHours.get(devB)||0)
    })
    return [
      ...this.generateDeveloperMoodSuggestions(),
      ...this.generateSharedTaskLowMoodSuggestions(),
      ...this.generateDelayedTaskSuggestions(developersByWorkHours),
      ...this.generateSkillMismatchSuggestions(),
      ...this.generateTaskExceedCostSuggestions(),
      ...this.generateTaskMissingDevelopersSuggestions(developersByWorkHours),
      ...this.riskSuggestions // Collect suggestions generated during risk metric calculations
    ].map(risk => risk.toJSON())
  }
  
  public generateDelayedTaskSuggestions(developersByWorkHours: UserTaskData[]) {
    const suggestions: DelayedTaskExceedSlack[] = []
    this.project.tasks.forEach((task) => {
      const projectDay = this.toProjectDays(new Date(Date.now()));
      if (task.startDate === undefined && projectDay > task.lateStart) {
        const delay = projectDay - task.lateStart;
        suggestions.push(
          new DelayedTaskExceedSlack(task, delay, developersByWorkHours)
        );
      }
    });
  
    return suggestions;
  }

  public generateTaskExceedCostSuggestions() {
    const suggestions: TaskExceedEstimatedCost[] = [];
    for (const task of this.project.tasks) {
      if (task.getCurrentCost() > task.estimatedCost) {
        suggestions.push(new TaskExceedEstimatedCost(task, this.project.budget))
      }
    }
    return suggestions;
  }

  public generateTaskMissingDevelopersSuggestions(developersByWorkHours: UserTaskData[]) {
    const suggestions: TaskMissingDevelopers[] = [];
    for (const task of this.project.tasks) {
      if (task.developers.length < task.expectedNumDevelopers && task.startDate !== undefined && task.completedDate === undefined) {
        suggestions.push(new TaskMissingDevelopers(task, developersByWorkHours));
      }
    }
    return suggestions  
  }

  /**
   * Weighted average of 3 most recent moods. Higher weighting for
   * more recent mood values.
   * @param mood - 3 most recent mood evaluations
   * @returns Weighted average mood
   */
  public static evalMood([a, b, c, d, e]: number[]) {
    return 0.05*a + 0.05+b + 0.1*c + 0.1*d + 0.7*e;
  }

  public generateDeveloperMoodSuggestions() {
    const suggestions: LowDeveloperMood[] = []
    if(this.project.mood === undefined) return suggestions
    Object.entries(this.project.mood).forEach(([developerID, mood]) => {
      const moodVal = ProjectEvaluator.evalMood(mood);
      if (moodVal < BAD_MOOD) {
        const developer = this.project.developers.find(userTaskData => userTaskData._id.toString() === developerID)
        if (developer === undefined) {
          throw Error(`Developer ${developerID} was in mood list but not found in project developers.`)
        }

        // Filter tasks which developer is assigned to
        const assignedTasks = this.project.tasks.filter(task => {
          return task.developers
            .map((userTaskData) => userTaskData._id.toString())
            .includes(developerID);
        })
        suggestions.push(new LowDeveloperMood(developer, moodVal, assignedTasks));
      }
    })
    return suggestions;
  }

  public generateSharedTaskLowMoodSuggestions() {
    const suggestions: SharedTaskLowMood[] = [];
    const developerToMood = new Map<string, number>();
    if(this.project.mood === undefined) return suggestions
    Object.entries(this.project.mood).forEach(([developerID, mood]) => {
      const moodVal = ProjectEvaluator.evalMood(mood);
      developerToMood.set(developerID, moodVal);
    })

    for (const task of this.project.tasks) {
      const lowMoodSameTaskDevelopers: UserTaskData[] = [];
      const moods: number[] = []
      for (const dev of task.developers) {
        console.log("dev is", dev)
        const mood = developerToMood.get(dev._id.toString())||0;
        if (mood <= BAD_MOOD) {
          lowMoodSameTaskDevelopers.push(dev)
          moods.push(mood)
        }
      }
      if (lowMoodSameTaskDevelopers.length > 1) {
        suggestions.push(new SharedTaskLowMood(lowMoodSameTaskDevelopers, moods, task))
      }
    }
    return suggestions
  }

  public generateSkillMismatchSuggestions() {
    const suggestions: SkillMismatch[] = []
    for (const task of this.project.tasks) {
      for (const dev of task.developers) {
        if(dev !== undefined) {
          const missingSkills = task.requiredSkills.filter(sk => !dev.skillSet.includes(sk));
          suggestions.push(new SkillMismatch(dev, task, this.project.developers, missingSkills))
        }
      }
    }
    return suggestions
  }

  public calcAvgMoodRisk() {
    let total = 0;
    const values = Object.values(this.project.mood)
    values.forEach((mood) => {
      total += ProjectEvaluator.evalMood(mood)
    })
    const val = total / values.length;
    // return new AverageMoodRisk()
  }

  public async calcCommitFrequency() {
    if (this.project.githubDetails == null) {
      return new CommitFrequency(0, this.weights.testCoverage)
    }
    const ghService = new GithubService(this.project.githubDetails);
    const commits = await ghService.listCommits();
    
    let result: number;
    const value = Commit.commitAlgorithm(commits);
    if (value < 1) {
      result = 1 - value;
    } else {
      result = 0
    }
    return new CommitFrequency(Math.min(result, 1), this.weights.testCoverage)

  }

  public projectedProjectTime() {
    const earlyStart: { [k: string]: number } = {};
    const lateStart: { [k: string]: number } = {};
    const lateFinish: { [k: string]: number } = {};
    const earlyFinish: { [k: string]: number } = {};

    for (const task of this.project.tasks) {
      earlyStart[task.name] = 0;
      earlyFinish[task.name] = task.calcEstDuration();
      for (const pred of task.dependencies) {
        earlyStart[task.name] = Math.max(
          earlyFinish[pred.name],
          earlyStart[task.name]
        );
      }
      earlyFinish[task.name] = earlyStart[task.name] + task.calcEstDuration();
      if (task.startDate !== undefined) {
        earlyStart[task.name] = this.toProjectDays(task.startDate);
        if (task.completedDate === undefined) {
          // If started and not complete, let earlyStart be the day it was started on
          earlyFinish[task.name] =
            earlyStart[task.name] + task.calcEstDuration();
        } else if (task.completedDate !== undefined) {
          // Completed
          earlyFinish[task.name] = this.toProjectDays(task.completedDate);
        }
      }
    }

    for (const task of [...this.project.tasks].reverse()) {
      lateFinish[task.name] = earlyFinish[task.name];
      for (const succ of task.successors) {
        lateFinish[task.name] = Math.min(
          lateStart[succ.name],
          lateFinish[task.name]
        );
      }
      lateStart[task.name] = lateFinish[task.name] - task.calcEstDuration();
    }

    const projectedFinish = Math.max(...Object.values(lateFinish));
    const criticalTasks = this.project.tasks.filter((t) => {
      // Only consider tasks without complete date since complete tasks
      // have no statistical variance
      return (
        t.completedDate === undefined &&
        lateFinish[t.name] - earlyFinish[t.name] === 0
      );
    });
    const totalVariance = criticalTasks.reduce(
      (sum: number, task) => sum + task.calcStdDev() ** 2,
      0
    )**2;

    // TODO: remove debugging
    // this.project.tasks.forEach((t) => {
    //   console.log("!!===========================");
    //   console.log(t.name, "[", t.calcEstDuration(), ((t.completedDate?.getTime() || 999) - (t.startDate?.getTime() || 999))/ (3600*1000*24), "]");
    //   console.log(earlyStart[t.name], lateStart[t.name]);
    //   console.log(earlyFinish[t.name], lateFinish[t.name]);
    //   console.log("!!===========================");
    // });

    return {
      projectedFinish,
      stdDev: Math.sqrt(totalVariance),
      projectedValues: {
        earlyStart,
        lateStart,
        lateFinish,
        earlyFinish,
      },
    };
  }

  public calcInitRisk() {
    const criticalPath = this.findCriticalTasks();
    const { estimatedTime, stdDev } = this.expectedProjectTime(criticalPath);
    console.log(estimatedTime, stdDev);
    return [
      this.calcMissingSkillCoverage(),
      this.calcStructuralComplexity(),
      this.calcBudgetUsage(),
      this.calcExceedTimeFrameProbability(estimatedTime, stdDev),
    ];
  }

  public findCriticalTasks() {
    // Update early start and finish times based on early finish time of predecessors
    for (const task of this.project.tasks) {
      task.calculateEarlyTime();
    }

    // Update late start and finish times absed on start time of predecessors
    for (const task of [...this.project.tasks].reverse()) {
      task.calculateLateTime();
    }

    // Critical tasks
    return this.project.tasks.filter((task) => task.slack === 0);
  }

  /**
   * Calculates fraction of budget estimated to
   * be consumed by tasks. Higher values indicate
   * higher chance of exceeding budget.
   *
   * A project can be over budget from the get-go if
   * estimates exceed project budget. Value can be greater
   * than 1.
   *
   * @returns Fraction of budget used by existing tasks
   */
  private calcBudgetUsage() {
    const totalEstimatedCost = this.project.tasks.reduce(
      (sum: number, { estimatedCost }) => sum + estimatedCost,
      0
    );
    if (this.project.budget === 0) {
      return new BudgetUsage(0, this.weights.budgetUsage);
    }
    const val = totalEstimatedCost / this.project.budget;
    if (val > 1) {
      const mostExpensiveTask = [...this.project.tasks].sort((t1, t2) => -t1.estimatedCost + t2.estimatedCost)[0]
      this.riskSuggestions.push(new MostExpensiveTask(mostExpensiveTask))
    }
    return new BudgetUsage(
      Math.min(val, 1), this.weights.budgetUsage
    );
  }

  /**
   * A heuristic considering number of tasks, their expected
   * number of developers, estimated duration, required skills.
   * Outputs a value in [0,1].
   */
  public calcProjectStructureComplexity() {
    return 0.5;
  }

  /**
   * Converts a project statistic (example: number of times a
   * task's duration was increased) into a metric with range [0,1].
   * This allows it to be used in a risk calculation formula
   * @param stat
   */
  private statisticToMetric(stat: number) {} // TODO: replace with RiskMetric class

  /**
   * Calculates expected duration of project and its standard deviation
   * based on a list of critical tasks
   * @param criticalPath List of critical tasks from the critical path method
   * @returns Estimated time and standard deviation
   */
  private expectedProjectTime(criticalPath: TopLevelTask[]): ProjectTimeResult {
    const estimatedTime = Math.max(...criticalPath.map((t) => t.earlyFinish));
    const totalVariance = criticalPath.reduce(
      (sum: number, task) => sum + task.calcStdDev() ** 2,
      0
    );
    return {
      estimatedTime,
      stdDev: Math.sqrt(totalVariance),
    };
  }

  /**
   * Uses estimated project duration and standard deviation derived from
   * critical path method and 3-point-estimation formula
   * @param estimatedTime Estimated project duration
   * @param stdDev Standard deviation of project duration
   * @returns Probability of project duration exceeding the time frame
   */
  private calcExceedTimeFrameProbability(
    estimatedTime: number,
    stdDev: number
  ) {
    // Greater stdDev means greater prob. of exceed right?
    const zScore = (this.project.timeFrameDays - estimatedTime) / stdDev;
    // Cumulative probability of values <= z/sqrt(2), in interval [-1, 1]
    const err = erf(zScore / Math.sqrt(2));
    // Map probability to range [0, 1]
    // and take 1 - p to get P(X > z/sqrt(2))
    const prob = 1 - (1 + err) / 2;
    console.log("Weights are...", this.weights)
    return new ProbabilityExceedTimeFrame(prob, this.weights.probabilityExceedTimeFrame);
  }

  private calcMissingSkillCoverage() {
    // Set of skills required by the project across all tasks
    const overallRequiredSkills = this.project.tasks.reduce(
      (skills: string[], { requiredSkills }) => {
        return [...skills, ...requiredSkills];
      },
      []
    );

    const uniqueRequiredSkills = [...new Set(overallRequiredSkills)];
    if (uniqueRequiredSkills.length === 0) {
      // Assume full coverage. Metric will have no effect on weighted sum
      return new MissingSkillCoverage(0, this.weights.missingSkillCoverage);
    }
    var numCoveredSkills = 0;
    for (const skill of uniqueRequiredSkills) {
      const developersWithSkill = this.project.developers.filter(
        ({ skillSet }) => skillSet.includes(skill)
      );
      if (developersWithSkill.length > 0) {
        numCoveredSkills++;
      } else {
        const tasksWithSkill = this.project.tasks.filter(t => {
          return t.requiredSkills.includes(skill)
        })
        this.riskSuggestions.push(new MissingSkill(skill, tasksWithSkill))
      }
    }
    const val = numCoveredSkills / uniqueRequiredSkills.length;
    return new MissingSkillCoverage(1 - val, this.weights.missingSkillCoverage);
  }

  public async calcRisk(): Promise<{ risk: RiskMetric[]; projectedCompletion: number; }> {
    const criticalPath = this.findCriticalTasks();
    // Time based off of completed task times and initial estimates (partial schedule)
    const {
      projectedFinish,
      stdDev: projStdDev,
      projectedValues,
    } = this.projectedProjectTime();
    console.log("Projected", { projectedFinish, projStdDev });

    const risk = [
      this.calcExceedTimeFrameProbability(projectedFinish, projStdDev),
      this.calcMissingSkillCoverage(),
      this.calcSchedulePerformanceIndex(),
      this.calcCostPerformanceIndex(),
      this.calcDeveloperUtilization(),
      (await this.calcScopeCreepRisk()),
      this.calcAvgTaskDurationError(),
    ];
    if (this.project.githubDetails !== null) {
      risk.push((await this.calcCommitFrequency()))
    }
    return {risk, projectedCompletion: projectedFinish}
  }

  public calcSchedulePerformanceIndex() {
    const days = this.toProjectDays(new Date(Date.now()));

    var earnedValue = 0;
    var plannedValue = 0;

    for (const task of this.project.tasks) {
      const duration = task.calcEstDuration();
      if (task.startDate !== undefined && task.completedDate !== undefined) {
        earnedValue += duration
      } else if (
        task.startDate !== undefined &&
        task.completedDate === undefined
      ) {
        earnedValue +=
          (Date.now() - task.startDate.getTime()) / (1000 * 3600 * 24);
      }
      // Only consider late starts
      if (task.lateFinish < days) {
        // Task is expected to be already complete
        plannedValue += duration;
      } else if (task.lateStart < days) {
        // Task expected to be already started
        plannedValue += days - task.lateStart;
      }
    }
    let val: number;
    if (plannedValue === 0) {
      val = 0;
    } else {
      console.log("SPI", earnedValue, plannedValue);
      val = earnedValue / plannedValue;
    }
    return new SchedulePerformanceIndex(val, this.weights.schedulePerformanceIndex);
  }

  /**
   * Calculates the Cost Performance Index using
   * the estimated cost of a task and its current total cost.
   * If it is complete, it's estimated cost is added
   * to the total earned value of the project.
   * @returns CPI of project
   */
  public calcCostPerformanceIndex() {
    // Total value from completed tasks
    var budgetedCost = 0;
    // Actual investment into all tasks
    var actualCost = 0;
    for (const task of this.project.tasks) {
      // If task complete, we gain the task's estimated cost as value
      if (task.isComplete()) {
        budgetedCost += task.estimatedCost;
      }
      // Sum of cost items
      const currCost = task.getCurrentCost();
      actualCost += currCost;
      // Only suggest for incomplete tasks
      if (currCost - task.estimatedCost > 0 && !task.isComplete()) {
        this.riskSuggestions.push(
          new TaskExceedEstimatedCost(task, this.project.budget)
        );
      }
    }
    // If > 1, peforming well budget-wise
    // If < 1, overspending, overbudget
    let cpi = budgetedCost / actualCost
    return new CostPerformanceIndex(Number.isNaN(cpi)? 0 : cpi, this.weights.costPerformanceIndex);
  }

  private getDeveloperWorkHours() {
    const assignedHours = new Map<UserTaskData, number>();
    this.project.developers.forEach((dev) => {
      assignedHours.set(dev, 0);
    });

    // Filter tasks which are started and not completed
    const currentTasks = this.project.tasks.filter(
      (task) => task.isStartedAndIncomplete()
    );
    for (const task of currentTasks) {
      // Duration in hours
      const duration = task.calcEstDuration() * 24; //R: doesn't this assume work 24hrs a day?
      for (const dev of assignedHours.keys()) {
        if (task.developers.includes(dev)) {
          // Assume work is evenly shared, then convert to hours per week
          const workHours = duration / task.developers.length;
          // @ts-ignore `weeklyWorkHours.get(dev)` is never undefined
          assignedHours.set(dev, assignedHours.get(dev) + workHours);
        }
      }
    }
    return assignedHours;
  }

  public calcStructuralComplexity() {
    let measure = 0;
    let depth = this.project.tasks.length;
    for (const task of this.project.tasks)  {
      const v1 = task.estimatedCost / (task.requiredSkills.length+1);
      const v2 = task.calcEstDuration() / this.project.timeFrameDays;
      const v3 = task.dependencies.length + task.successors.length;
      measure += (v1 + v2 + v3) / 4
      depth += v3 * v2
    }
    const val = this.project.tasks.length < 5 ? measure / 20 : (depth * measure)
    return new StructuralComplexity(val, this.weights.testCoverage);
  }

  /**
   * Calculates the relative deviation of developer's weekly work hours from
   * the mean weekly work hours, possibly creating new risk suggestions.
   *
   * Accounts for developers working part-time.
   *
   * Calculates an estimate for worker utilization.
   * @returns estimated utilization rate based on developers' assigned tasks
   * assuming a 40 hour work week.
   */
  //R: ok you talk me through this one? I'm just a bit confused of the structure
  public calcDeveloperUtilization() {
    const weeklyWorkHours = this.getDeveloperWorkHours();
    const values = weeklyWorkHours.values();
    var meanHours = 0;
    for (const hours of values) {
      meanHours += hours;
    }
    meanHours /= weeklyWorkHours.size;

    var totalSquaredDiff = 0;
    for (const hours of values) {
      totalSquaredDiff = (hours - meanHours) ** 2;
    }
    const stdDev = Math.sqrt(totalSquaredDiff / weeklyWorkHours.size);

    const developerAssignedTasks = new Map<UserTaskData, TopLevelTask[]>();
    for (const task of this.project.tasks) {
      // Ignore tasks not started or completed
      if (task.startDate === undefined || task.completedDate !== undefined)
        continue;
      for (const dev of task.developers) {
        developerAssignedTasks.set(dev, [
          ...(developerAssignedTasks.get(dev) || []),
          task,
        ]);
      }
    }

    // Calculate relative deviation from mean
    // Values: > 0 indicate over working
    //         < 0 indicate under working
    // The further the value from 0, the more significant
    var meanUtilization = 0;
    for (const [dev, hours] of weeklyWorkHours.entries()) {
      const relativeDev = (hours - meanHours) / stdDev;
      if (relativeDev >= 1) {
        // Overworked developer
        this.riskSuggestions.push(
          new UnevenWorkDistribution(
            dev,
            relativeDev,
            developerAssignedTasks.get(dev) || []
          )
        );
      }
      meanUtilization += hours / 40;
    }
    return new WorkerUtilization(Math.min(meanUtilization / weeklyWorkHours.size, 1) || 0, this.weights.workerUtilization);
  }

  public calcAvgTaskDurationError() {
    let nTasks = 0;
    let totalPercentageDiff = 0;

    for (const task of this.project.tasks) {
      const actualDuration = task.getActualDuration();
      if (actualDuration === undefined) continue;

      const estDuration = task.calcEstDuration();
      const diff = (actualDuration - estDuration);
      if (diff < 0) continue; // Ignore early completions
      const percentDiff = (actualDuration - estDuration) / estDuration
      // Cap values at 100% difference
      totalPercentageDiff += Math.min(percentDiff, 1);
      nTasks += 1;
    }

    return new AvgTaskDurationError(totalPercentageDiff / nTasks || 0, this.weights.taskDurationError);
  }

  /**
   * Percentage of completed tasks which are verified tested.
   */
  public calcTestCoverage() {
    return new TestCoverage(0.5, this.weights.testCoverage);
  }

  public getRiskSuggestions() {
    return this.riskSuggestions;
  }

  public getProjectStatus() {
    const allComplete = this.project.tasks.every(
      (t) => t.completedDate !== undefined
    );
    const exceedTimeFrame =
      this.toProjectDays(new Date(Date.now())) > this.project.timeFrameDays;
    if (!exceedTimeFrame && allComplete) {
      return ProjectStatus.Success;
    } else if (!exceedTimeFrame) {
      // tasks not all complete
      return ProjectStatus.InProgress;
    } else {
      return ProjectStatus.Failure;
    }
  }

  /**
   * Finds the mean number of tasks added to the previous successful projects
   */
  private static async getMeanTasksAdded() {
    const prevEvals: ISavedEvaluation[] = await SavedEvaluation.aggregate()
      .limit(5)
      .match({ status: ProjectStatus.Failure })
      .exec();
    const totalTasksAdded = prevEvals.map(e => e.numTasksAdded).reduce((sum, val) => sum+val, 0);
    return (totalTasksAdded / prevEvals.length) || 0; // If division by 0, take mean as 0
  }

  public async calcScopeCreepRisk() {
    const meanTasksAdded = await ProjectEvaluator.getMeanTasksAdded();
    const val = Math.min((this.numTasksAdded/meanTasksAdded) || 0, 1)
    return new ScopeCreep(val, this.weights.taskDurationError, Math.floor(meanTasksAdded)+1)
  }







  public static async testCPM() {
    function dummyTask(
      name: string,
      pred: TopLevelTask[],
      duration: number,
      cost: number
    ) {
      // Initialize with 0 start & finish times
      return new TopLevelTask(
        pred,
        cost,
        duration * 0.8,
        duration,
        duration * 1.5,
        0,
        [],
        name,
        [],
        [],
        0,
        0,
        0,
        0,
        0,
        []
      );
    }

    const task1 = dummyTask("Task 1", [], 4, 80);
    task1.startDate = new Date(2023, 1, 24);
    task1.completedDate = new Date(2023, 1, 28);
    const task2 = dummyTask("Task 2", [task1], 2, 55);
    const task3 = dummyTask("Task 3", [task2], 5, 50);
    const task4 = dummyTask("Task 4", [task3], 3, 20);
    const task5 = dummyTask("Task 5", [task4], 1, 90);
    const tasks = [task1, task2, task3, task4, task5];

    const project = new Project(
      new Types.ObjectId(),
      "",
      new Types.ObjectId(),
      tasks,
      [],
      400,
      new Date(),
      17,
      new Date(),
      {'':[]},
      null
    );
    project.startDate.setMonth(0);
    const evaluator = new ProjectEvaluator(project, new ProjectStatistics(), await RiskMetric.generateProjectWeights(), 0, []);
    const path = evaluator.findCriticalTasks();
    project.tasks.forEach((t) => {
      console.log("===========================");
      console.log(t.name, "[", t.calcEstDuration(), "]");
      console.log(t.earlyStart, t.lateStart);
      console.log(t.earlyFinish, t.lateFinish);
      console.log("===========================");
    });

    console.log(evaluator.projectedProjectTime());
    // console.log(path);

    console.log(evaluator.calcInitRisk()[1].value);
    evaluator.getRiskMetricBreakdown();
  }
}
