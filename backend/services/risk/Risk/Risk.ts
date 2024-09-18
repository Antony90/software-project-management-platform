import RiskSeverity from "common/build-models/RiskSeverity";
import RiskType from "common/build-models/RiskType";

export default abstract class Risk {
  public severity: RiskSeverity = RiskSeverity.Minor;
  
  constructor(
    public name: string,
    public type: RiskType
  ) {}

  /**
   * Converts risk into readable string
   */
  public abstract getDescription(): string;

  /**
   * Suggestion for how to resolve the risk as a readable string
   */
  public abstract getResolution(): { messages: string[], extras: any };
  public abstract evaluateSeverity(): RiskSeverity;
  public toJSON() {
    return {
      name: this.name,
      type: this.type,
      severity: this.evaluateSeverity(),
      description: this.getDescription(),
      resolution: this.getResolution(),
    };
  }
}
