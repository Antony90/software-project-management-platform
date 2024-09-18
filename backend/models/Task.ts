import mTask from "common/build-models/Task";
import {UserTaskData} from "./User";

export class Task implements mTask<UserTaskData> {
  constructor(
    public name: string,
    public subtasks: Task[],
    public developers: UserTaskData[],
    public optimistic: number,
    public mostLikely: number,
    public pessimistic: number
  ) {}

  static fromJSON(obj: any): Task[] {
    return obj.map((task: any) => {
      return new Task(
        task.name,
        this.fromJSON(task.subtasks),
        task.developers,
        task.optimistic,
        task.mostLikely,
        task.pessimistic
      );
    });
  }

  public calcEstDuration(): number {
    if (this.subtasks.length === 0) {
      return Math.round((this.optimistic + 1 * this.mostLikely + this.pessimistic) / 3);
    } else {
      return this.subtasks.reduce((sum: number, task: Task) => (sum + task.calcEstDuration()), 0)
    }
  }

  public calcStdDev(): number {
    if (this.subtasks.length === 0) {
      return Math.round((this.pessimistic - this.optimistic) / Math.sqrt(6));
    } else {
      const totalVariance = this.subtasks.reduce((sum: number, task: Task) => (sum + task.calcStdDev()**2), 0)
      return Math.sqrt(totalVariance)
    }
  }

}

const taskStr =
  '[{"name": "Task 1", "time": 12, "subtasks": [{"name": "Subtask 1.1", "time": 2, "subtasks": []}]}, {"name": "Task 2", "time": 5, "subtasks": [{"name": "Subtask 2.1", "time": 4, "subtasks": []}]}]';